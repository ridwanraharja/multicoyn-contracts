// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/ITokenRegistry.sol";
import "../interfaces/IPriceFeed.sol";

// Manages supported tokens and their price feeds

contract TokenRegistry is ITokenRegistry, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public constant NATIVE_TOKEN = address(0);

    // Maximum price staleness (8 hours)
    uint256 public constant MAX_PRICE_STALENESS = 8 hours;

    // Token configurations
    mapping(address => TokenConfig) private _tokenConfigs;

    // List of all registered tokens
    address[] private _registeredTokens;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function registerToken(
        address token,
        address priceFeed,
        uint8 decimals,
        uint256 minPaymentAmount
    ) external override onlyRole(ADMIN_ROLE) {
        require(priceFeed != address(0), "TokenRegistry: invalid price feed");
        require(decimals > 0 && decimals <= 18, "TokenRegistry: invalid decimals");
        require(!_tokenConfigs[token].enabled, "TokenRegistry: token already registered");

        _tokenConfigs[token] = TokenConfig({
            enabled: true,
            priceFeed: priceFeed,
            decimals: decimals,
            minPaymentAmount: minPaymentAmount
        });

        _registeredTokens.push(token);

        emit TokenRegistered(token, priceFeed);
        emit TokenEnabled(token, true);
    }

    function setTokenEnabled(address token, bool enabled) external override onlyRole(ADMIN_ROLE) {
        require(_tokenConfigs[token].priceFeed != address(0), "TokenRegistry: token not registered");

        _tokenConfigs[token].enabled = enabled;
        emit TokenEnabled(token, enabled);
    }

    function updatePriceFeed(address token, address priceFeed) external override onlyRole(ADMIN_ROLE) {
        require(_tokenConfigs[token].priceFeed != address(0), "TokenRegistry: token not registered");
        require(priceFeed != address(0), "TokenRegistry: invalid price feed");

        _tokenConfigs[token].priceFeed = priceFeed;
        emit TokenRegistered(token, priceFeed);
    }

    function getTokenConfig(address token) external view override returns (TokenConfig memory) {
        return _tokenConfigs[token];
    }

    function isTokenEnabled(address token) external view override returns (bool) {
        return _tokenConfigs[token].enabled;
    }

    function getTokenPriceUSD(address token)
        external
        view
        override
        returns (uint256 price, uint256 timestamp)
    {
        TokenConfig memory config = _tokenConfigs[token];
        require(config.enabled, "TokenRegistry: token not enabled");
        require(config.priceFeed != address(0), "TokenRegistry: price feed not set");

        IPriceFeed priceFeed = IPriceFeed(config.priceFeed);

        (
            /* uint80 roundId */,
            int256 answer,
            /* uint256 startedAt */,
            uint256 updatedAt,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();

        require(answer > 0, "TokenRegistry: invalid price");
        require(
            block.timestamp - updatedAt <= MAX_PRICE_STALENESS,
            "TokenRegistry: stale price data"
        );

        return (uint256(answer), updatedAt);
    }

    function getRegisteredTokens() external view returns (address[] memory) {
        return _registeredTokens;
    }

    function getRegisteredTokenCount() external view returns (uint256) {
        return _registeredTokens.length;
    }
}
