import { ethers } from "hardhat";
import { parseUnits } from "ethers";
import fs from "fs";
import path from "path";

/**
 * Alternative Deployment Script (without Hardhat Ignition)
 * Use this if you prefer manual deployment with more control
 */

// Helper function to wait between transactions
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("\n================================================");
  console.log("🚀 MultiCoyn Payment Router Deployment");
  console.log("================================================\n");
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  const isTestnet = network.chainId === 4202n || network.chainId === 31337n;

  // ============================================
  // STEP 1: DEPLOY TOKEN REGISTRY
  // ============================================
  console.log("📋 Step 1: Deploying TokenRegistry...");
  const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await TokenRegistry.deploy();
  await tokenRegistry.waitForDeployment();
  const tokenRegistryAddress = await tokenRegistry.getAddress();
  console.log(`✅ TokenRegistry deployed: ${tokenRegistryAddress}\n`);

  // ============================================
  // STEP 2: DEPLOY MOCK TOKENS (TESTNET ONLY)
  // ============================================
  let tokens: any = {};
  let priceFeeds: any = {};

  if (isTestnet) {
    console.log("🪙 Step 2: Deploying Mock Tokens...");

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const MockIDRX = await ethers.getContractFactory("MockIDRX");

    // Deploy payment tokens
    const usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await usdc.waitForDeployment();
    tokens.usdc = await usdc.getAddress();
    console.log(`  USDC: ${tokens.usdc}`);

    const usdt = await MockERC20.deploy("Mock USDT", "USDT", 6);
    await usdt.waitForDeployment();
    tokens.usdt = await usdt.getAddress();
    console.log(`  USDT: ${tokens.usdt}`);

    const dai = await MockERC20.deploy("Mock DAI", "DAI", 18);
    await dai.waitForDeployment();
    tokens.dai = await dai.getAddress();
    console.log(`  DAI: ${tokens.dai}`);

    const wbtc = await MockERC20.deploy("Mock WBTC", "WBTC", 8);
    await wbtc.waitForDeployment();
    tokens.wbtc = await wbtc.getAddress();
    console.log(`  WBTC: ${tokens.wbtc}`);

    // Deploy settlement token
    const idrx = await MockIDRX.deploy();
    await idrx.waitForDeployment();
    tokens.idrx = await idrx.getAddress();
    console.log(`  IDRX: ${tokens.idrx}\n`);

    // ============================================
    // STEP 3: DEPLOY PRICE FEEDS
    // ============================================
    console.log("📊 Step 3: Deploying Price Feeds...");

    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const MockIDRXPriceFeed = await ethers.getContractFactory("MockIDRXPriceFeed");

    // ETH Price Feed: $2,000
    const ethPriceFeed = await MockPriceFeed.deploy(200000000000n, 8, "ETH/USD");
    await ethPriceFeed.waitForDeployment();
    priceFeeds.eth = await ethPriceFeed.getAddress();
    console.log(`  ETH: ${priceFeeds.eth} ($2,000)`);

    // USDC Price Feed: $1.00
    const usdcPriceFeed = await MockPriceFeed.deploy(100000000n, 8, "USDC/USD");
    await usdcPriceFeed.waitForDeployment();
    priceFeeds.usdc = await usdcPriceFeed.getAddress();
    console.log(`  USDC: ${priceFeeds.usdc} ($1.00)`);

    // USDT Price Feed: $1.00
    const usdtPriceFeed = await MockPriceFeed.deploy(100000000n, 8, "USDT/USD");
    await usdtPriceFeed.waitForDeployment();
    priceFeeds.usdt = await usdtPriceFeed.getAddress();
    console.log(`  USDT: ${priceFeeds.usdt} ($1.00)`);

    // DAI Price Feed: $1.00
    const daiPriceFeed = await MockPriceFeed.deploy(100000000n, 8, "DAI/USD");
    await daiPriceFeed.waitForDeployment();
    priceFeeds.dai = await daiPriceFeed.getAddress();
    console.log(`  DAI: ${priceFeeds.dai} ($1.00)`);

    // WBTC Price Feed: $40,000
    const wbtcPriceFeed = await MockPriceFeed.deploy(4000000000000n, 8, "WBTC/USD");
    await wbtcPriceFeed.waitForDeployment();
    priceFeeds.wbtc = await wbtcPriceFeed.getAddress();
    console.log(`  WBTC: ${priceFeeds.wbtc} ($40,000)`);

    // IDRX Price Feed: $0.000064
    const idrxPriceFeed = await MockIDRXPriceFeed.deploy();
    await idrxPriceFeed.waitForDeployment();
    priceFeeds.idrx = await idrxPriceFeed.getAddress();
    console.log(`  IDRX: ${priceFeeds.idrx} ($0.000064)\n`);
  }

  // ============================================
  // STEP 4: DEPLOY PAYMENT ROUTER
  // ============================================
  console.log("💳 Step 4: Deploying PaymentRouter...");
  const PaymentRouter = await ethers.getContractFactory("PaymentRouter");
  const paymentRouter = await PaymentRouter.deploy(tokenRegistryAddress);
  await paymentRouter.waitForDeployment();
  const paymentRouterAddress = await paymentRouter.getAddress();
  console.log(`✅ PaymentRouter deployed: ${paymentRouterAddress}\n`);

  // ============================================
  // STEP 5: CONFIGURE TOKEN REGISTRY
  // ============================================
  if (isTestnet) {
    console.log("⚙️  Step 5: Configuring TokenRegistry...");

    // Register Native Token (ETH/LSK)
    console.log("  Registering Native Token (ETH/LSK)...");
    let tx = await tokenRegistry.registerToken(
      "0x0000000000000000000000000000000000000000",
      priceFeeds.eth,
      18,
      parseUnits("0.001", 18)
    );
    await tx.wait();
    await delay(2000);

    // Register USDC
    console.log("  Registering USDC...");
    tx = await tokenRegistry.registerToken(
      tokens.usdc,
      priceFeeds.usdc,
      6,
      parseUnits("1", 6)
    );
    await tx.wait();
    await delay(2000);

    // Register USDT
    console.log("  Registering USDT...");
    tx = await tokenRegistry.registerToken(
      tokens.usdt,
      priceFeeds.usdt,
      6,
      parseUnits("1", 6)
    );
    await tx.wait();
    await delay(2000);

    // Register DAI
    console.log("  Registering DAI...");
    tx = await tokenRegistry.registerToken(
      tokens.dai,
      priceFeeds.dai,
      18,
      parseUnits("1", 18)
    );
    await tx.wait();
    await delay(2000);

    // Register WBTC
    console.log("  Registering WBTC...");
    tx = await tokenRegistry.registerToken(
      tokens.wbtc,
      priceFeeds.wbtc,
      8,
      parseUnits("0.0001", 8)
    );
    await tx.wait();
    await delay(2000);

    // Register IDRX
    console.log("  Registering IDRX...");
    tx = await tokenRegistry.registerToken(
      tokens.idrx,
      priceFeeds.idrx,
      18,
      parseUnits("1000", 18)
    );
    await tx.wait();
    await delay(2000);

    console.log("✅ All tokens registered\n");
  }

  // ============================================
  // STEP 6: CONFIGURE PAYMENT ROUTER
  // ============================================
  if (isTestnet) {
    console.log("⚙️  Step 6: Configuring PaymentRouter...");

    // Set settlement tokens
    console.log("  Setting settlement tokens (IDRX & USDT)...");
    let tx2 = await paymentRouter.setSettlementTokens(tokens.idrx, tokens.usdt);
    await tx2.wait();
    await delay(2000);

    // Set minimum pool balances
    console.log("  Setting minimum pool balances...");
    tx2 = await paymentRouter.setMinimumPoolBalance(tokens.idrx, parseUnits("100000", 18));
    await tx2.wait();
    await delay(2000);

    tx2 = await paymentRouter.setMinimumPoolBalance(tokens.usdt, parseUnits("100", 6));
    await tx2.wait();
    await delay(2000);

    console.log("✅ PaymentRouter configured\n");
  }

  // ============================================
  // SAVE DEPLOYMENT INFO
  // ============================================
  const deploymentInfo = {
    version: "2.0.0",
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    architecture: "Treasury-based Settlement",
    features: [
      "Multi-token payment",
      "Single stablecoin settlement (IDRX/USDT)",
      "Automatic cashback for overpayment",
      "No merchant registration required"
    ],
    contracts: {
      core: {
        PaymentRouter: paymentRouterAddress,
        TokenRegistry: tokenRegistryAddress
      },
      ...(isTestnet && {
        paymentTokens: {
          Native: "0x0000000000000000000000000000000000000000",
          USDC: tokens.usdc,
          USDT: tokens.usdt,
          DAI: tokens.dai,
          WBTC: tokens.wbtc
        },
        settlementTokens: {
          IDRX: tokens.idrx,
          USDT: tokens.usdt
        },
        priceFeeds: {
          ETH: priceFeeds.eth,
          USDC: priceFeeds.usdc,
          USDT: priceFeeds.usdt,
          DAI: priceFeeds.dai,
          WBTC: priceFeeds.wbtc,
          IDRX: priceFeeds.idrx
        }
      })
    }
  };

  // Save to file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

  console.log("================================================");
  console.log("✅ DEPLOYMENT COMPLETED!");
  console.log("================================================\n");
  console.log(`📄 Deployment info saved to: ${filename}\n`);

  console.log("📋 NEXT STEPS:\n");
  console.log("1. Verify contracts on block explorer:");
  console.log(`   npx hardhat verify --network ${network.name} ${tokenRegistryAddress}`);
  console.log(`   npx hardhat verify --network ${network.name} ${paymentRouterAddress} ${tokenRegistryAddress}\n`);

  if (isTestnet) {
    console.log("2. Fund settlement pools:");
    console.log(`   - Mint IDRX tokens to deployer`);
    console.log(`   - Approve PaymentRouter to spend IDRX & USDT`);
    console.log(`   - Call fundSettlementPool() for both tokens\n`);

    console.log("3. Test the system:");
    console.log(`   - Mint test tokens to user address`);
    console.log(`   - Approve PaymentRouter to spend tokens`);
    console.log(`   - Call pay() function with multi-token payment\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
