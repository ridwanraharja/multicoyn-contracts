# MultiCoyn - Multi-Token Payment Router

A decentralized payment infrastructure that enables merchants to accept payments in **any cryptocurrency** while receiving settlements in their preferred **stablecoin** (USDT or IDRX). Built on Lisk blockchain with treasury-based settlement architecture.

## 🌟 Overview

MultiCoyn solves a critical problem in crypto payments: **merchants want stable currency**, but **users want to pay with their preferred tokens**. Our payment router acts as an intelligent intermediary that:

1. **Accepts multi-token payments** - Users can pay with ETH, USDC, USDT, DAI, WBTC, or any combination
2. **Settles in stablecoins** - Merchants always receive USDT or IDRX (Indonesian Rupiah stablecoin)
3. **Handles overpayments** - Automatic cashback in the settlement currency if user overpays
4. **No merchant registration** - Any wallet can receive payments instantly

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER PAYMENT FLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   User Wallet          PaymentRouter              Merchant          │
│   ┌─────────┐         ┌─────────────┐           ┌─────────┐        │
│   │ ETH     │ ──pay──►│             │──settle──►│ IDRX or │        │
│   │ USDC    │         │  Treasury   │           │ USDT    │        │
│   │ WBTC    │         │  Pool       │           │         │        │
│   │ etc.    │ ◄──────▼│             │◄─cashback─│         │        │
│   └─────────┘         └─────────────┘           └─────────┘        │
│                              │                                      │
│                              │                                      │
│                     ┌────────▼────────┐                            │
│                     │  Token Registry │                            │
│                     │  (Price Feeds)  │                            │
│                     └─────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Contracts

| Contract                 | Description                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| **PaymentRouter**        | Main payment processing contract with treasury-based settlement     |
| **TokenRegistry**        | Manages supported tokens and their Chainlink-compatible price feeds |
| **SimpleNFTMarketplace** | Example integration - NFT marketplace powered by PaymentRouter      |

## ✨ Key Features

### Multi-Token Payments

- Pay with up to **5 different tokens** in a single transaction
- Combine ETH + USDC + DAI in one payment
- Real-time USD value calculation via price oracles

### Stablecoin Settlement

- Merchants choose **USDT** (USD) or **IDRX** (Indonesian Rupiah)
- Consistent settlement regardless of payment tokens
- Treasury pool ensures instant liquidity

### Automatic Cashback

- Overpayments are automatically refunded
- Cashback in settlement currency (same as merchant receives)
- Minimum threshold: $0.10 USD equivalent

### Fee Structure

- **0.3%** platform fee on product price
- Fee collected separately from merchant settlement
- Transparent fee calculation on-chain

### External Call Support

- Execute arbitrary contract calls during payment
- Perfect for NFT purchases, subscriptions, or service activations
- Settlement tokens approved to target contract

## 📦 Supported Tokens

### Payment Tokens

| Token   | Decimals | Description             |
| ------- | -------- | ----------------------- |
| ETH/LSK | 18       | Native blockchain token |
| USDC    | 6        | USD Coin                |
| USDT    | 6        | Tether USD              |
| DAI     | 18       | Dai Stablecoin          |
| WBTC    | 8        | Wrapped Bitcoin         |

### Settlement Tokens

| Token | Decimals | Description                  |
| ----- | -------- | ---------------------------- |
| USDT  | 6        | Tether USD                   |
| IDRX  | 2        | Indonesian Rupiah stablecoin |

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/multicoyn-contracts.git
cd multicoyn-contracts

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PRIVATE_KEY
```

### Environment Variables

```env
PRIVATE_KEY=your_wallet_private_key
REPORT_GAS=true  # Optional: for gas reporting
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/Lock.ts
```

### Deploy to Lisk Sepolia (Testnet)

```bash
# Deploy all contracts
npx hardhat run scripts/deploy.ts --network liskSepolia

# Fund settlement pools
npx hardhat run scripts/fund-pools.ts --network liskSepolia

# Verify contracts on Blockscout
npx hardhat run scripts/verify-contracts.ts --network liskSepolia
```

### Deploy to Lisk Mainnet

```bash
npx hardhat run scripts/deploy.ts --network lisk
```

## 📋 Contract Addresses (Lisk Sepolia Testnet)

### Core Contracts

| Contract      | Address                                      |
| ------------- | -------------------------------------------- |
| PaymentRouter | `0x7b3dfd5A3F3903237faC3D2de69d4c1915A09C9A` |
| TokenRegistry | `0x8515a560284AedE5D78Ff5b73f2CeCa247DCAab7` |

### Payment Tokens

| Token            | Address                                      |
| ---------------- | -------------------------------------------- |
| Native (ETH/LSK) | `0x0000000000000000000000000000000000000000` |
| USDC             | `0x5DD8eEF51d251a53D6368CfD79a88F3BC186514B` |
| USDT             | `0xc9013AD6e74A7dC418b2e601aaCD772044E59c22` |
| DAI              | `0xF84851B3A4253b74813112A5488E38E724731E2a` |
| WBTC             | `0x437f0b6328892ac36E01836aBc865d16c875D291` |

### Settlement Tokens

| Token | Address                                      |
| ----- | -------------------------------------------- |
| IDRX  | `0x5324Cd3e781cf85Cf63253138Ef6c6E84143de7B` |
| USDT  | `0xc9013AD6e74A7dC418b2e601aaCD772044E59c22` |

### NFT Marketplace

| Contract             | Address                                      |
| -------------------- | -------------------------------------------- |
| MockNFT              | `0xd5B14514255B6a6B23930A9D779414D59aA4D64b` |
| SimpleNFTMarketplace | `0xB2f127912AD550d4b8aFb0BC78A5Ff32f24c330a` |

## 🔧 Usage Examples

### Basic Payment (JavaScript/Ethers.js)

```javascript
const { ethers } = require("ethers");

// Connect to PaymentRouter
const paymentRouter = new ethers.Contract(
  "0x7b3dfd5A3F3903237faC3D2de69d4c1915A09C9A",
  PaymentRouterABI,
  signer
);

// Pay with USDC for a $10 product, settle in IDRX
const tokens = ["0x5DD8eEF51d251a53D6368CfD79a88F3BC186514B"]; // USDC
const amounts = [ethers.parseUnits("10.03", 6)]; // $10 + 0.3% fee
const productPriceUSD = ethers.parseUnits("10", 8); // $10 in 1e8 scale

// Approve USDC first
await usdcContract.approve(paymentRouter.address, amounts[0]);

// Execute payment
const tx = await paymentRouter.pay(
  merchantAddress, // Merchant wallet
  tokens, // Payment tokens
  amounts, // Token amounts
  productPriceUSD, // Product price in USD (1e8 scale)
  true, // settleInIDR: true = IDRX, false = USDT
  ethers.ZeroAddress, // No external call
  "0x" // No calldata
);
```

### Multi-Token Payment

```javascript
// Pay with ETH + USDC for a $100 product
const tokens = [
  ethers.ZeroAddress, // Native ETH
  "0x5DD8eEF51d251a53D6368CfD79a88F3BC186514B", // USDC
];
const amounts = [
  ethers.parseEther("0.025"), // ~$50 in ETH
  ethers.parseUnits("50.30", 6), // ~$50.30 in USDC
];

const tx = await paymentRouter.pay(
  merchantAddress,
  tokens,
  amounts,
  ethers.parseUnits("100", 8), // $100 product
  false, // Settle in USDT
  ethers.ZeroAddress,
  "0x",
  { value: amounts[0] } // Send ETH with transaction
);
```

### Payment with External Call (NFT Purchase)

```javascript
// Buy NFT through marketplace using PaymentRouter
const marketplace = "0xB2f127912AD550d4b8aFb0BC78A5Ff32f24c330a";
const listingId = 1;

// Encode marketplace buyNFTFor function
const callData = marketplaceInterface.encodeFunctionData("buyNFTFor", [
  listingId,
  buyerAddress,
]);

const tx = await paymentRouter.pay(
  sellerAddress,
  tokens,
  amounts,
  nftPriceUSD,
  true, // Settle in IDRX
  marketplace, // Target contract
  callData // Encoded function call
);
```

## 🛠️ Available Scripts

| Script                       | Description                          |
| ---------------------------- | ------------------------------------ |
| `deploy.ts`                  | Full deployment of all contracts     |
| `deploy-marketplace-only.ts` | Deploy only NFT marketplace          |
| `fund-pools.ts`              | Fund settlement pools with IDRX/USDT |
| `mint-tokens.ts`             | Mint test tokens (testnet only)      |
| `mint-nfts-from-pinata.ts`   | Mint NFTs from Pinata IPFS           |
| `list-nfts.ts`               | List NFTs on marketplace             |
| `verify-contracts.ts`        | Verify contracts on Blockscout       |

## 📁 Project Structure

```
multicoyn-contracts/
├── contracts/
│   ├── core/
│   │   ├── PaymentRouter.sol      # Main payment processing
│   │   └── TokenRegistry.sol      # Token & price feed management
│   ├── interfaces/
│   │   ├── IPaymentRouter.sol
│   │   ├── ITokenRegistry.sol
│   │   └── IPriceFeed.sol
│   ├── marketplace/
│   │   └── SimpleNFTMarketplace.sol
│   └── mocks/
│       ├── MockERC20.sol
│       ├── MockIDRX.sol
│       ├── MockNFT.sol
│       └── MockPriceFeed.sol
├── scripts/
│   ├── deploy.ts
│   ├── fund-pools.ts
│   └── ...
├── test/
├── deployments/
│   └── liskSepolia.json           # Deployed addresses
├── hardhat.config.ts
└── package.json
```

## 🔐 Security Features

- **ReentrancyGuard** - Protection against reentrancy attacks
- **Pausable** - Emergency pause functionality
- **Ownable** - Admin-only functions for critical operations
- **SafeERC20** - Safe token transfer handling
- **Price staleness check** - Maximum 8-hour price feed age
- **Treasury isolation** - Settlement pools protected from collected balances

## 🌐 Network Configuration

| Network                | Chain ID | RPC URL                         |
| ---------------------- | -------- | ------------------------------- |
| Lisk Sepolia (Testnet) | 4202     | `https://lisk-sepolia.drpc.org` |
| Lisk Mainnet           | 1135     | `https://rpc.lisk.com`          |
| Hardhat Local          | 31337    | `http://127.0.0.1:8545`         |

## 📊 Gas Optimization

The contracts are optimized with:

- Solidity 0.8.28 with optimizer (200 runs)
- `viaIR` enabled for advanced optimizations
- Unchecked arithmetic where safe
- Efficient storage packing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Lisk Sepolia Explorer**: [https://sepolia-blockscout.lisk.com](https://sepolia-blockscout.lisk.com)
- **Lisk Mainnet Explorer**: [https://blockscout.lisk.com](https://blockscout.lisk.com)
- **Lisk Documentation**: [https://docs.lisk.com](https://docs.lisk.com)

---

Built with ❤️ for the Lisk ecosystem
