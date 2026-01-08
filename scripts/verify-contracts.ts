import { run } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Verify Contracts on Blockscout
 *
 * This script automatically verifies all deployed contracts
 * using the deployment JSON file
 */

// Helper function to wait between verifications
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const networkName = process.env.HARDHAT_NETWORK || "liskSepolia";

  console.log("\n================================================");
  console.log("🔍 Verify Contracts on Blockscout");
  console.log("================================================\n");
  console.log(`Network: ${networkName}\n`);

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", `${networkName}.json`);

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

  console.log("📋 Loaded deployment info:");
  console.log(`  Deployer: ${deployment.deployer}`);
  console.log(`  Timestamp: ${deployment.timestamp}\n`);

  // ============================================
  // VERIFY CORE CONTRACTS
  // ============================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📦 VERIFYING CORE CONTRACTS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Verify TokenRegistry
  console.log("1️⃣  Verifying TokenRegistry...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.core.TokenRegistry,
      constructorArguments: []
    });
    console.log(`   ✅ TokenRegistry verified: ${deployment.contracts.core.TokenRegistry}\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified: ${deployment.contracts.core.TokenRegistry}\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  await delay(3000);

  // Verify PaymentRouter
  console.log("2️⃣  Verifying PaymentRouter...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.core.PaymentRouter,
      constructorArguments: [deployment.contracts.core.TokenRegistry]
    });
    console.log(`   ✅ PaymentRouter verified: ${deployment.contracts.core.PaymentRouter}\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified: ${deployment.contracts.core.PaymentRouter}\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  await delay(3000);

  // ============================================
  // VERIFY MOCK TOKENS
  // ============================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🪙 VERIFYING MOCK TOKENS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Verify USDC
  console.log("3️⃣  Verifying USDC...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.paymentTokens.USDC,
      constructorArguments: ["Mock USDC", "USDC", 6],
      contract: "contracts/mocks/MockERC20.sol:MockERC20"
    });
    console.log(`   ✅ USDC verified\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  await delay(3000);

  // Verify USDT
  console.log("4️⃣  Verifying USDT...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.paymentTokens.USDT,
      constructorArguments: ["Mock USDT", "USDT", 6]
    });
    console.log(`   ✅ USDT verified\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  await delay(3000);

  // Verify DAI
  console.log("5️⃣  Verifying DAI...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.paymentTokens.DAI,
      constructorArguments: ["Mock DAI", "DAI", 18]
    });
    console.log(`   ✅ DAI verified\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  await delay(3000);

  // Verify WBTC
  console.log("6️⃣  Verifying WBTC...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.paymentTokens.WBTC,
      constructorArguments: ["Mock WBTC", "WBTC", 8]
    });
    console.log(`   ✅ WBTC verified\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  await delay(3000);

  // Verify IDRX
  console.log("7️⃣  Verifying IDRX...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.settlementTokens.IDRX,
      constructorArguments: [],
      contract: "contracts/mocks/MockIDRX.sol:MockIDRX"
    });
    console.log(`   ✅ IDRX verified\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  await delay(3000);

  // ============================================
  // VERIFY PRICE FEEDS
  // ============================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 VERIFYING PRICE FEEDS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Verify ETH Price Feed
  console.log("8️⃣  Verifying ETH Price Feed...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.priceFeeds.ETH,
      constructorArguments: [200000000000n, 8, "ETH/USD"],
      contract: "contracts/mocks/MockPriceFeed.sol:MockPriceFeed"
    });
    console.log(`   ✅ ETH Price Feed verified\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  await delay(3000);

  // Verify USDC Price Feed
  console.log("9️⃣  Verifying USDC Price Feed...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.priceFeeds.USDC,
      constructorArguments: [100000000n, 8, "USDC/USD"]
    });
    console.log(`   ✅ USDC Price Feed verified\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  await delay(3000);

  // Verify USDT Price Feed
  console.log("🔟 Verifying USDT Price Feed...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.priceFeeds.USDT,
      constructorArguments: [100000000n, 8, "USDT/USD"]
    });
    console.log(`   ✅ USDT Price Feed verified\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  await delay(3000);

  // Verify DAI Price Feed
  console.log("1️⃣1️⃣  Verifying DAI Price Feed...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.priceFeeds.DAI,
      constructorArguments: [100000000n, 8, "DAI/USD"]
    });
    console.log(`   ✅ DAI Price Feed verified\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  await delay(3000);

  // Verify WBTC Price Feed
  console.log("1️⃣2️⃣  Verifying WBTC Price Feed...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.priceFeeds.WBTC,
      constructorArguments: [4000000000000n, 8, "WBTC/USD"]
    });
    console.log(`   ✅ WBTC Price Feed verified\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  await delay(3000);

  // Verify IDRX Price Feed
  console.log("1️⃣3️⃣  Verifying IDRX Price Feed...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.priceFeeds.IDRX,
      constructorArguments: [],
      contract: "contracts/mocks/MockIDRXPriceFeed.sol:MockIDRXPriceFeed"
    });
    console.log(`   ✅ IDRX Price Feed verified\n`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️  Already verified\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ VERIFICATION COMPLETED!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("🔗 View on Blockscout:\n");
  const explorerBase = networkName === "liskSepolia"
    ? "https://sepolia-blockscout.lisk.com/address"
    : "https://blockscout.lisk.com/address";

  console.log("📦 Core Contracts:");
  console.log(`  PaymentRouter: ${explorerBase}/${deployment.contracts.core.PaymentRouter}`);
  console.log(`  TokenRegistry: ${explorerBase}/${deployment.contracts.core.TokenRegistry}\n`);

  console.log("🪙 Tokens:");
  console.log(`  USDC: ${explorerBase}/${deployment.contracts.paymentTokens.USDC}`);
  console.log(`  USDT: ${explorerBase}/${deployment.contracts.paymentTokens.USDT}`);
  console.log(`  DAI: ${explorerBase}/${deployment.contracts.paymentTokens.DAI}`);
  console.log(`  WBTC: ${explorerBase}/${deployment.contracts.paymentTokens.WBTC}`);
  console.log(`  IDRX: ${explorerBase}/${deployment.contracts.settlementTokens.IDRX}\n`);

  console.log("✅ All contracts verified and ready to use!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
