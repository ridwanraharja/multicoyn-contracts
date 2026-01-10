// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IPaymentRouter.sol";
import "../interfaces/ITokenRegistry.sol";

// Main contract for processing multi-token payments with treasury-based settlement

contract PaymentRouter is IPaymentRouter, ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    address public constant NATIVE_TOKEN = address(0);

    // Fee configuration
    uint256 public constant FEE_BASIS_POINTS = 30; // 0.3% = 30/10000

    // Minimum cashback threshold ($0.10 USD)
    uint256 public constant MIN_CASHBACK_USD = 1e7; // 0.10 in 1e8 scale

    // Settlement token addresses
    address public IDRX_TOKEN;
    address public USDT_TOKEN;

    // Token registry contract
    ITokenRegistry public immutable tokenRegistry;

    // Collected tokens (user payments, withdrawable by owner as profit)
    mapping(address => uint256) public collectedBalances;

    // Settlement pools (pre-funded by owner, protected for merchant settlements)
    mapping(address => uint256) public settlementPools;

    // Minimum pool balance thresholds
    mapping(address => uint256) public minimumPoolBalance;

    mapping(bytes32 => Payment) private _payments;

    uint256 private _paymentCounter;

    constructor(address _tokenRegistry) Ownable(msg.sender) {
        require(_tokenRegistry != address(0), "PaymentRouter: invalid registry");
        tokenRegistry = ITokenRegistry(_tokenRegistry);
    }

    function setSettlementTokens(address _idrx, address _usdt) external onlyOwner {
        require(_idrx != address(0), "PaymentRouter: invalid IDRX");
        require(_usdt != address(0), "PaymentRouter: invalid USDT");
        IDRX_TOKEN = _idrx;
        USDT_TOKEN = _usdt;
        emit SettlementTokensUpdated(_idrx, _usdt);
    }

    function fundSettlementPool(address token, uint256 amount) external onlyOwner {
        require(token == IDRX_TOKEN || token == USDT_TOKEN, "PaymentRouter: invalid settlement token");
        require(amount > 0, "PaymentRouter: invalid amount");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        settlementPools[token] += amount;

        emit SettlementPoolFunded(token, amount);
    }

    function withdrawCollectedTokens(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "PaymentRouter: invalid amount");
        require(collectedBalances[token] >= amount, "PaymentRouter: insufficient collected balance");

        collectedBalances[token] -= amount;

        if (token == NATIVE_TOKEN) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }

        emit CollectedTokensWithdrawn(token, amount, msg.sender);
    }

    function emergencyWithdrawPool(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "PaymentRouter: invalid amount");
        require(settlementPools[token] >= amount, "PaymentRouter: insufficient pool balance");

        settlementPools[token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);

        emit EmergencyPoolWithdrawal(token, amount, msg.sender);
    }

    function setMinimumPoolBalance(address token, uint256 minimum) external onlyOwner {
        require(token == IDRX_TOKEN || token == USDT_TOKEN, "PaymentRouter: invalid settlement token");
        minimumPoolBalance[token] = minimum;
        emit MinimumPoolBalanceUpdated(token, minimum);
    }

    function pay(
        address payable merchantAddress,
        address[] calldata tokens,
        uint256[] calldata amounts,
        uint256 productPriceUSD,
        bool settleInIDR
    ) external payable override nonReentrant whenNotPaused returns (bytes32 paymentId) {
        require(merchantAddress != address(0), "PaymentRouter: invalid merchant");
        require(tokens.length > 0, "PaymentRouter: empty tokens");
        require(tokens.length == amounts.length, "PaymentRouter: length mismatch");
        require(tokens.length <= 5, "PaymentRouter: too many tokens");
        require(productPriceUSD > 0, "PaymentRouter: invalid product price");

        // Collect payment tokens to treasury
        uint256 totalPaidUSD = 0;
        uint256 nativeAmountRequired = 0;

        for (uint256 i = 0; i < tokens.length;) {
            require(amounts[i] > 0, "PaymentRouter: invalid amount");

            uint256 usdValue = calculateUSDValue(tokens[i], amounts[i]);
            totalPaidUSD += usdValue;

            if (tokens[i] == NATIVE_TOKEN) {
                nativeAmountRequired += amounts[i];
                collectedBalances[NATIVE_TOKEN] += amounts[i];
            } else {
                require(tokenRegistry.isTokenEnabled(tokens[i]), "PaymentRouter: token not enabled");
                IERC20(tokens[i]).safeTransferFrom(msg.sender, address(this), amounts[i]);
                collectedBalances[tokens[i]] += amounts[i];
            }

            unchecked { ++i; }
        }

        // Validate native amount sent
        require(msg.value >= nativeAmountRequired, "PaymentRouter: insufficient native");

        // Calculate payment breakdown
        PaymentCalculation memory calc = _calculatePayment(
            totalPaidUSD,
            productPriceUSD,
            settleInIDR
        );

        // Get settlement token address
        address settlementTokenAddr = settleInIDR ? IDRX_TOKEN : USDT_TOKEN;

        // Verify settlement pool sufficiency
        uint256 totalRequired = calc.settlementAmount + calc.cashbackAmount;
        _requireSufficientPool(settlementTokenAddr, totalRequired);

        // Settle merchant (transfer from settlement pool)
        _settleMerchant(merchantAddress, settlementTokenAddr, calc.settlementAmount);

        // Send cashback (if above threshold)
        if (calc.excessUSD >= MIN_CASHBACK_USD && calc.cashbackAmount > 0) {
            _sendCashback(msg.sender, settlementTokenAddr, calc.cashbackAmount);
        }

        // Record payment
        paymentId = _generatePaymentId();
        _payments[paymentId] = Payment({
            merchant: merchantAddress,
            payer: msg.sender,
            totalPaidUSD: calc.totalPaidUSD,
            productPriceUSD: calc.productPriceUSD,
            feeUSD: calc.feeUSD,
            excessUSD: calc.excessUSD,
            settleInIDR: settleInIDR,
            settlementAmount: calc.settlementAmount,
            cashbackAmount: calc.cashbackAmount,
            tokens: tokens,
            amounts: amounts,
            timestamp: block.timestamp
        });

        // Emit event
        emit PaymentExecuted(
            paymentId,
            merchantAddress,
            msg.sender,
            calc.totalPaidUSD,
            calc.productPriceUSD,
            calc.feeUSD,
            calc.excessUSD,
            settleInIDR,
            calc.settlementAmount,
            calc.cashbackAmount,
            tokens,
            amounts
        );

        return paymentId;
    }

    function _calculatePayment(
        uint256 totalPaidUSD,
        uint256 productPriceUSD,
        bool settleInIDR
    ) internal view returns (PaymentCalculation memory calc) {
        calc.totalPaidUSD = totalPaidUSD;
        calc.productPriceUSD = productPriceUSD;

        calc.feeUSD = (productPriceUSD * FEE_BASIS_POINTS) / 10000;

        uint256 totalRequired = productPriceUSD + calc.feeUSD;

        require(
            totalPaidUSD >= totalRequired,
            "PaymentRouter: insufficient payment"
        );

        calc.excessUSD = totalPaidUSD - totalRequired;

        // Convert to settlement token
        address token = settleInIDR ? IDRX_TOKEN : USDT_TOKEN;

        calc.settlementAmount = _convertUSDToToken(calc.productPriceUSD, token);

        calc.cashbackAmount = calc.excessUSD > 0 ? _convertUSDToToken(calc.excessUSD, token) : 0;

        return calc;
    }

    function _convertUSDToToken(
        uint256 usdAmount,
        address token
    ) internal view returns (uint256 tokenAmount) {
        (uint256 tokenPrice, ) = tokenRegistry.getTokenPriceUSD(token);
        require(tokenPrice > 0, "PaymentRouter: invalid price");

        ITokenRegistry.TokenConfig memory config = tokenRegistry.getTokenConfig(token);

        // usdAmount is 1e8 scaled
        // tokenPrice is 1e8 scaled (e.g., IDRX = $0.000064 = 6400)
        // tokenAmount = (usdAmount * 10^decimals) / tokenPrice

        tokenAmount = (usdAmount * (10 ** config.decimals)) / tokenPrice;

        return tokenAmount;
    }

    function _settleMerchant(
        address merchantAddress,
        address settlementToken,
        uint256 amount
    ) internal {
        settlementPools[settlementToken] -= amount;
        IERC20(settlementToken).safeTransfer(merchantAddress, amount);
        emit MerchantSettled(merchantAddress, settlementToken, amount);
    }

    function _sendCashback(
        address recipient,
        address token,
        uint256 amount
    ) internal {
        if (amount > 0) {
            settlementPools[token] -= amount;
            IERC20(token).safeTransfer(recipient, amount);
            emit CashbackSent(recipient, token, amount);
        }
    }

    function _requireSufficientPool(address token, uint256 amount) internal view {
        uint256 available = settlementPools[token];
        require(
            available >= amount + minimumPoolBalance[token],
            "PaymentRouter: insufficient settlement pool"
        );
    }

    function calculateTotalValue(
        address[] calldata tokens,
        uint256[] calldata amounts
    ) external view override returns (uint256 totalUSD) {
        require(tokens.length == amounts.length, "PaymentRouter: length mismatch");

        totalUSD = 0;
        for (uint256 i = 0; i < tokens.length;) {
            totalUSD += calculateUSDValue(tokens[i], amounts[i]);
            unchecked { ++i; }
        }

        return totalUSD;
    }

    function validatePayment(
        address[] calldata tokens,
        uint256[] calldata amounts,
        uint256 expectedUSD
    ) external view override returns (bool valid, uint256 actualUSD) {
        if (tokens.length == 0 || tokens.length != amounts.length || tokens.length > 5) {
            return (false, 0);
        }

        actualUSD = 0;
        for (uint256 i = 0; i < tokens.length;) {
            if (!tokenRegistry.isTokenEnabled(tokens[i])) {
                return (false, 0);
            }
            if (amounts[i] == 0) {
                return (false, 0);
            }
            actualUSD += calculateUSDValue(tokens[i], amounts[i]);
            unchecked { ++i; }
        }

        valid = actualUSD >= expectedUSD;
        return (valid, actualUSD);
    }

    function getPayment(bytes32 paymentId) external view override returns (Payment memory payment) {
        return _payments[paymentId];
    }

    function calculateUSDValue(address token, uint256 amount)
        public
        view
        override
        returns (uint256 usdValue)
    {
        (uint256 price, ) = tokenRegistry.getTokenPriceUSD(token);
        ITokenRegistry.TokenConfig memory config = tokenRegistry.getTokenConfig(token);

        // Price is scaled by 1e8, normalize to 18 decimals
        // usdValue = (amount * price) / (10 ** config.decimals)
        usdValue = (amount * price) / (10 ** config.decimals);

        return usdValue;
    }

    function feePercentage() external pure override returns (uint256) {
        return FEE_BASIS_POINTS;
    }

    function getSettlementPoolBalance(address token) external view returns (uint256 balance) {
        return settlementPools[token];
    }

    function getCollectedBalance(address token) external view returns (uint256 balance) {
        return collectedBalances[token];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _generatePaymentId() private returns (bytes32 paymentId) {
        _paymentCounter++;
        return keccak256(abi.encodePacked(block.timestamp, msg.sender, _paymentCounter));
    }

    receive() external payable {}
}
