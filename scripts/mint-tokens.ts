import { ethers } from "hardhat";
import { parseUnits } from "ethers";
import fs from "fs";
import path from "path";

/**
 * Mint Tokens Script
 *
 * Script untuk mint mock tokens ke address tertentu
 * Bisa digunakan untuk testing atau keperluan lain
 */

// Helper function to wait between transactions
async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = process.env.HARDHAT_NETWORK || "liskSepolia";

  console.log("\n================================================");
  console.log("🪙 Mint Mock Tokens");
  console.log("================================================\n");
  console.log(`Network: ${networkName}`);
  console.log(`Deployer: ${deployer.address}\n`);

  // Load deployment info
  const deploymentPath = path.join(
    __dirname,
    "..",
    "deployments",
    `${networkName}.json`
  );

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

  console.log("📋 Loaded deployment info:");
  console.log(`  Deployer: ${deployment.deployer}`);
  console.log(`  Timestamp: ${deployment.timestamp}\n`);

  // ============================================
  // CONFIGURATION
  // ============================================

  // GANTI ADDRESS INI SESUAI KEBUTUHAN
  const recipientAddress = "0x740F4ffd755Be5888aD1260609510dc1da0445C9";

  // GANTI JUMLAH TOKEN SESUAI KEBUTUHAN
  const amounts = {
    USDC: "1000", // 1000 USDC
    USDT: "1000", // 1000 USDT
    DAI: "1000", // 1000 DAI
    WBTC: "1", // 1 WBTC
    IDRX: "10000000", // 10,000,000 IDRX
  };

  console.log("🎯 Mint Configuration:");
  console.log(`  Recipient: ${recipientAddress}`);
  console.log(`  USDC: ${amounts.USDC}`);
  console.log(`  USDT: ${amounts.USDT}`);
  console.log(`  DAI: ${amounts.DAI}`);
  console.log(`  WBTC: ${amounts.WBTC}`);
  console.log(`  IDRX: ${amounts.IDRX}\n`);

  // Validate recipient address
  if (!ethers.isAddress(recipientAddress)) {
    throw new Error("⚠️  Please set a valid recipient address in the script!");
  }

  // Get contract instances
  const usdc = await ethers.getContractAt(
    "MockERC20",
    deployment.contracts.paymentTokens.USDC
  );
  const usdt = await ethers.getContractAt(
    "MockERC20",
    deployment.contracts.paymentTokens.USDT
  );
  const dai = await ethers.getContractAt(
    "MockERC20",
    deployment.contracts.paymentTokens.DAI
  );
  const wbtc = await ethers.getContractAt(
    "MockERC20",
    deployment.contracts.paymentTokens.WBTC
  );
  const idrx = await ethers.getContractAt(
    "MockIDRX",
    deployment.contracts.settlementTokens.IDRX
  );

  // ============================================
  // MINT TOKENS
  // ============================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🪙 MINTING TOKENS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Mint USDC (6 decimals)
  console.log("1️⃣  Minting USDC...");
  const usdcAmount = parseUnits(amounts.USDC, 6);
  let tx = await usdc.mint(recipientAddress, usdcAmount);
  await tx.wait();
  console.log(`   ✅ Minted ${amounts.USDC} USDC to ${recipientAddress}\n`);
  await delay(2000);

  // Mint USDT (6 decimals)
  console.log("2️⃣  Minting USDT...");
  const usdtAmount = parseUnits(amounts.USDT, 6);
  tx = await usdt.mint(recipientAddress, usdtAmount);
  await tx.wait();
  console.log(`   ✅ Minted ${amounts.USDT} USDT to ${recipientAddress}\n`);
  await delay(2000);

  // Mint DAI (18 decimals)
  console.log("3️⃣  Minting DAI...");
  const daiAmount = parseUnits(amounts.DAI, 18);
  tx = await dai.mint(recipientAddress, daiAmount);
  await tx.wait();
  console.log(`   ✅ Minted ${amounts.DAI} DAI to ${recipientAddress}\n`);
  await delay(2000);

  // Mint WBTC (8 decimals)
  console.log("4️⃣  Minting WBTC...");
  const wbtcAmount = parseUnits(amounts.WBTC, 8);
  tx = await wbtc.mint(recipientAddress, wbtcAmount);
  await tx.wait();
  console.log(`   ✅ Minted ${amounts.WBTC} WBTC to ${recipientAddress}\n`);
  await delay(2000);

  // Mint IDRX (18 decimals)
  console.log("5️⃣  Minting IDRX...");
  const idrxAmount = parseUnits(amounts.IDRX, 18);
  tx = await idrx.mint(recipientAddress, idrxAmount);
  await tx.wait();
  console.log(`   ✅ Minted ${amounts.IDRX} IDRX to ${recipientAddress}\n`);

  // ============================================
  // VERIFY BALANCES
  // ============================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ VERIFYING BALANCES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const usdcBalance = await usdc.balanceOf(recipientAddress);
  const usdtBalance = await usdt.balanceOf(recipientAddress);
  const daiBalance = await dai.balanceOf(recipientAddress);
  const wbtcBalance = await wbtc.balanceOf(recipientAddress);
  const idrxBalance = await idrx.balanceOf(recipientAddress);

  console.log(`💰 ${recipientAddress} balances:\n`);
  console.log(`  USDC: ${ethers.formatUnits(usdcBalance, 6)}`);
  console.log(`  USDT: ${ethers.formatUnits(usdtBalance, 6)}`);
  console.log(`  DAI: ${ethers.formatUnits(daiBalance, 18)}`);
  console.log(`  WBTC: ${ethers.formatUnits(wbtcBalance, 8)}`);
  console.log(`  IDRX: ${ethers.formatUnits(idrxBalance, 18)}\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ MINTING COMPLETED!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const explorerBase =
    networkName === "liskSepolia"
      ? "https://sepolia-blockscout.lisk.com/address"
      : "https://blockscout.lisk.com/address";

  console.log("🔗 View balances on Blockscout:");
  console.log(`  ${explorerBase}/${recipientAddress}\n`);

  console.log("📝 Token Addresses:");
  console.log(`  USDC: ${deployment.contracts.paymentTokens.USDC}`);
  console.log(`  USDT: ${deployment.contracts.paymentTokens.USDT}`);
  console.log(`  DAI: ${deployment.contracts.paymentTokens.DAI}`);
  console.log(`  WBTC: ${deployment.contracts.paymentTokens.WBTC}`);
  console.log(`  IDRX: ${deployment.contracts.settlementTokens.IDRX}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
