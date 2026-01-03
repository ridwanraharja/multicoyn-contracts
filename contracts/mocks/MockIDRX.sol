// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MockERC20.sol";

// 1 IDRX = 1 Indonesian Rupiah (IDR) ≈ $0.000064 USD

contract MockIDRX is MockERC20 {
    constructor() MockERC20("Indonesian Rupiah X", "IDRX", 18) {}
}
