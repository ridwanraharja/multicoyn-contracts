// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
 
// Managing supported tokens and their configurations

interface ITokenRegistry {
    struct TokenConfig {
        bool enabled;
        address priceFeed;
        uint8 decimals;
        uint256 minPaymentAmount;
    }

    event TokenRegistered(address indexed token, address indexed priceFeed);

    event TokenEnabled(address indexed token, bool enabled);

    // use address(0) for native ETH/LSK
    function registerToken(
        address token,
        address priceFeed,
        uint8 decimals,
        uint256 minPaymentAmount
    ) external;

    function setTokenEnabled(address token, bool enabled) external;

    function updatePriceFeed(address token, address priceFeed) external;

    function getTokenConfig(address token) external view returns (TokenConfig memory);
    
    function isTokenEnabled(address token) external view returns (bool);

    // Price in USD (scaled by 1e8)
    function getTokenPriceUSD(address token) external view returns (uint256 price, uint256 timestamp);
}
