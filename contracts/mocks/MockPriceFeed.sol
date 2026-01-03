// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IPriceFeed.sol";

// Mock and Simulates Chainlink AggregatorV3Interface behavior

contract MockPriceFeed is IPriceFeed {
    int256 private _price;
    uint8 private _decimals;
    string private _description;
    uint80 private _roundId;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "MockPriceFeed: caller is not the owner");
        _;
    }

    constructor(int256 initialPrice, uint8 decimals_, string memory description_) {
        require(initialPrice > 0, "MockPriceFeed: invalid price");
        _price = initialPrice;
        _decimals = decimals_;
        _description = description_;
        _roundId = 1;
        owner = msg.sender;
    }

    function updatePrice(int256 newPrice) external onlyOwner {
        require(newPrice > 0, "MockPriceFeed: invalid price");
        _price = newPrice;
        _roundId++;
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (_roundId, _price, block.timestamp, block.timestamp, _roundId);
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function description() external view override returns (string memory) {
        return _description;
    }

    function getPrice() external view returns (int256) {
        return _price;
    }
}
