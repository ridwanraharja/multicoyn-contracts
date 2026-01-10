// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Interface for the main payment routing contract

interface IPaymentRouter {
    struct PaymentCalculation {
        uint256 totalPaidUSD;
        uint256 productPriceUSD;
        uint256 feeUSD;
        uint256 excessUSD;
        uint256 settlementAmount;
        uint256 cashbackAmount;
    }

    struct Payment {
        address merchant;
        address payer;
        uint256 totalPaidUSD;
        uint256 productPriceUSD;
        uint256 feeUSD;
        uint256 excessUSD;
        bool settleInIDR;
        uint256 settlementAmount;
        uint256 cashbackAmount;
        address[] tokens;
        uint256[] amounts;
        uint256 timestamp;
    }

    event PaymentExecuted(
        bytes32 indexed paymentId,
        address indexed merchant,
        address indexed payer,
        uint256 totalPaidUSD,
        uint256 productPriceUSD,
        uint256 feeUSD,
        uint256 excessUSD,
        bool settleInIDR,
        uint256 settlementAmount,
        uint256 cashbackAmount,
        address[] tokens,
        uint256[] amounts
    );

    event MerchantSettled(
        address indexed merchant,
        address indexed token,
        uint256 amount
    );

    event CashbackSent(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    event SettlementPoolFunded(
        address indexed token,
        uint256 amount
    );

    event CollectedTokensWithdrawn(
        address indexed token,
        uint256 amount,
        address indexed recipient
    );

    event EmergencyPoolWithdrawal(
        address indexed token,
        uint256 amount,
        address indexed recipient
    );

    event MinimumPoolBalanceUpdated(
        address indexed token,
        uint256 newMinimum
    );

    event SettlementTokensUpdated(
        address indexed idrx,
        address indexed usdt
    );

    function pay(
        address payable merchantAddress,
        address[] calldata tokens,
        uint256[] calldata amounts,
        uint256 productPriceUSD,
        bool settleInIDR
    ) external payable returns (bytes32 paymentId);

    function calculateTotalValue(
        address[] calldata tokens,
        uint256[] calldata amounts
    ) external view returns (uint256 totalUSD);

    function validatePayment(
        address[] calldata tokens,
        uint256[] calldata amounts,
        uint256 expectedUSD
    ) external view returns (bool valid, uint256 actualUSD);

    function getPayment(bytes32 paymentId) external view returns (Payment memory payment);

    function calculateUSDValue(address token, uint256 amount)
        external
        view
        returns (uint256 usdValue);

    function feePercentage() external view returns (uint256);
}
