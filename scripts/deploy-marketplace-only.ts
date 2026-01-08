import { ethers } from "hardhat";

/**
 * Deploy ONLY SimpleNFTMarketplace to testnet
 * (Karena USDT, IDRX, dan NFT sudah di-deploy sebelumnya)
 */
async function main() {
  console.log("🚀 Deploying SimpleNFTMarketplace to Lisk Sepolia\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log();

  // Deploy SimpleNFTMarketplace
  console.log("📦 Deploying SimpleNFTMarketplace...");
  const SimpleNFTMarketplace = await ethers.getContractFactory("SimpleNFTMarketplace");
  const marketplace = await SimpleNFTMarketplace.deploy();
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();

  console.log("✅ SimpleNFTMarketplace deployed to:", marketplaceAddress);
  console.log();

  console.log("=" .repeat(60));
  console.log("📝 Contract Addresses:");
  console.log("=" .repeat(60));
  console.log("SimpleNFTMarketplace:", marketplaceAddress);
  console.log();

  console.log("📝 Save to .env:");
  console.log(`MARKETPLACE_ADDRESS=${marketplaceAddress}`);
  console.log();

  console.log("📝 Next Steps:");
  console.log("1. Verify contract:");
  console.log(`   npx hardhat verify --network liskSepolia ${marketplaceAddress}`);
  console.log();
  console.log("2. Test listing NFT:");
  console.log("   - Approve marketplace: mockNFT.setApprovalForAll(marketplace, true)");
  console.log("   - List NFT: marketplace.listNFT(nftAddress, tokenId, usdtAddress, price)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
