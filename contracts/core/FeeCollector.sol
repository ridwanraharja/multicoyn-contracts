// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Collects and manages protocol fees

contract FeeCollector is Ownable {
    using SafeERC20 for IERC20;

    address public constant NATIVE_TOKEN = address(0);

    // Protocol fee percentage (in basis points, 30 = 0.3%)
    uint256 public feePercentage;

    // Fee balances by token
    mapping(address => uint256) private _feeBalances;

    // Authorized contracts that can collect fees
    mapping(address => bool) private _authorizedCollectors;

    event FeeCollected(address indexed token, uint256 amount, address indexed collector);

    event FeeWithdrawn(address indexed token, uint256 amount, address indexed recipient);

    event FeePercentageUpdated(uint256 oldFee, uint256 newFee);

    event CollectorAuthorized(address indexed collector, bool authorized);

    constructor(uint256 initialFeePercentage) Ownable(msg.sender) {
        require(initialFeePercentage <= 1000, "FeeCollector: fee too high"); // Max 10%
        feePercentage = initialFeePercentage;
    }

    function setCollectorAuthorization(address collector, bool authorized) external onlyOwner {
        require(collector != address(0), "FeeCollector: invalid collector");
        _authorizedCollectors[collector] = authorized;
        emit CollectorAuthorized(collector, authorized);
    }

    function setFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "FeeCollector: fee too high"); // Max 10%
        uint256 oldFee = feePercentage;
        feePercentage = newFeePercentage;
        emit FeePercentageUpdated(oldFee, newFeePercentage);
    }

    function collectFee(address token, uint256 amount) external payable returns (uint256 feeAmount) {
        require(_authorizedCollectors[msg.sender], "FeeCollector: unauthorized collector");
        require(amount > 0, "FeeCollector: invalid amount");

        feeAmount = (amount * feePercentage) / 10000;

        if (token == NATIVE_TOKEN) {
            require(msg.value >= feeAmount, "FeeCollector: insufficient fee");
            _feeBalances[NATIVE_TOKEN] += feeAmount;
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), feeAmount);
            _feeBalances[token] += feeAmount;
        }

        emit FeeCollected(token, feeAmount, msg.sender);
        return feeAmount;
    }

    function withdrawFees(address token, uint256 amount, address payable recipient) external onlyOwner {
        require(recipient != address(0), "FeeCollector: invalid recipient");
        require(amount > 0, "FeeCollector: invalid amount");
        require(_feeBalances[token] >= amount, "FeeCollector: insufficient balance");

        _feeBalances[token] -= amount;

        if (token == NATIVE_TOKEN) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "FeeCollector: transfer failed");
        } else {
            IERC20(token).safeTransfer(recipient, amount);
        }

        emit FeeWithdrawn(token, amount, recipient);
    }

    function getFeeBalance(address token) external view returns (uint256 balance) {
        return _feeBalances[token];
    }

    // Check if an address is an authorized collector
    function isAuthorizedCollector(address collector) external view returns (bool) {
        return _authorizedCollectors[collector];
    }

    function calculateFee(uint256 amount) external view returns (uint256 feeAmount) {
        return (amount * feePercentage) / 10000;
    }

    receive() external payable {}
}
