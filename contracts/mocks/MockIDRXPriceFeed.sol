// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MockPriceFeed.sol";

// 1 IDRX = 1 IDR ≈ $0.000064 USD (assuming 1 USD = 15,600 IDR)
// Price = 0.000064 * 1e8 = 6400

contract MockIDRXPriceFeed is MockPriceFeed {
    constructor() MockPriceFeed(
        6400,
        8,
        "IDRX/USD"
    ) {}
}
