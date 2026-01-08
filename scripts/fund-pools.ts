import { ethers } from "hardhat";
import { parseUnits } from "ethers";
import fs from "fs";
import path from "path";

/**
 * Fund Settlement Pools Script
 *
 * This script funds the PaymentRouter settlement pools with IDRX and USDT
 * Required before merchants can receive payments
 */

// Helper function to wait between transactions
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("\n================================================");
  console.log("💰 Fund Settlement Pools");
  console.log("================================================\n");
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}\n`);

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

  // Get contract addresses
  const paymentRouterAddress = deployment.contracts.core.PaymentRouter;
  const idrxAddress = deployment.contracts.settlementTokens.IDRX;
  const usdtAddress = deployment.contracts.settlementTokens.USDT;

  console.log("📋 Contract Addresses:");
  console.log(`  PaymentRouter: ${paymentRouterAddress}`);
  console.log(`  IDRX: ${idrxAddress}`);
  console.log(`  USDT: ${usdtAddress}\n`);

  // Get contract instances
  const paymentRouter = await ethers.getContractAt("PaymentRouter", paymentRouterAddress);
  const idrx = await ethers.getContractAt("MockIDRX", idrxAddress);
  const usdt = await ethers.getContractAt("MockERC20", usdtAddress);

  // ============================================
  // STEP 1: MINT TOKENS TO DEPLOYER
  // ============================================
  console.log("🪙 Step 1: Minting tokens to deployer...");

  // Mint 10,000,000 IDRX (for ~$640 worth at $0.000064 per IDRX)
  const idrxAmount = parseUnits("10000000", 18);
  console.log(`  Minting ${ethers.formatUnits(idrxAmount, 18)} IDRX...`);
  let tx = await idrx.mint(deployer.address, idrxAmount);
  await tx.wait();
  await delay(2000);

  // Mint 10,000 USDT
  const usdtAmount = parseUnits("10000", 6);
  console.log(`  Minting ${ethers.formatUnits(usdtAmount, 6)} USDT...`);
  tx = await usdt.mint(deployer.address, usdtAmount);
  await tx.wait();
  await delay(2000);

  console.log("✅ Tokens minted\n");

  // ============================================
  // STEP 2: APPROVE PAYMENT ROUTER
  // ============================================
  console.log("✅ Step 2: Approving PaymentRouter...");

  console.log("  Approving IDRX...");
  tx = await idrx.approve(paymentRouterAddress, idrxAmount);
  await tx.wait();
  await delay(2000);

  console.log("  Approving USDT...");
  tx = await usdt.approve(paymentRouterAddress, usdtAmount);
  await tx.wait();
  await delay(2000);

  console.log("✅ Approvals completed\n");

  // ============================================
  // STEP 3: FUND SETTLEMENT POOLS
  // ============================================
  console.log("💰 Step 3: Funding settlement pools...");

  // Fund IDRX pool
  console.log(`  Funding IDRX pool with ${ethers.formatUnits(idrxAmount, 18)} IDRX...`);
  tx = await paymentRouter.fundSettlementPool(idrxAddress, idrxAmount);
  await tx.wait();
  await delay(2000);

  // Fund USDT pool
  console.log(`  Funding USDT pool with ${ethers.formatUnits(usdtAmount, 6)} USDT...`);
  tx = await paymentRouter.fundSettlementPool(usdtAddress, usdtAmount);
  await tx.wait();
  await delay(2000);

  console.log("✅ Pools funded\n");

  // ============================================
  // STEP 4: VERIFY POOL BALANCES
  // ============================================
  console.log("🔍 Step 4: Verifying pool balances...");

  const idrxPoolBalance = await paymentRouter.getSettlementPoolBalance(idrxAddress);
  const usdtPoolBalance = await paymentRouter.getSettlementPoolBalance(usdtAddress);

  console.log(`  IDRX Pool: ${ethers.formatUnits(idrxPoolBalance, 18)} IDRX`);
  console.log(`  USDT Pool: ${ethers.formatUnits(usdtPoolBalance, 6)} USDT\n`);

  console.log("================================================");
  console.log("✅ SETTLEMENT POOLS FUNDED!");
  console.log("================================================\n");

  console.log("🎉 The system is now ready to process payments!\n");
  console.log("📋 Pool Summary:");
  console.log(`  - IDRX: ${ethers.formatUnits(idrxPoolBalance, 18)} tokens (~$${(Number(ethers.formatUnits(idrxPoolBalance, 18)) * 0.000064).toFixed(2)} USD)`);
  console.log(`  - USDT: ${ethers.formatUnits(usdtPoolBalance, 6)} tokens\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
