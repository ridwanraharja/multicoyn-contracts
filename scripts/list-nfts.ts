import { ethers } from "hardhat";

/**
 * Script to list all Hypurr NFTs on SimpleNFTMarketplace
 */
async function main() {
  console.log("📝 Listing NFTs on Marketplace\n");

  const [deployer] = await ethers.getSigners();
  console.log("Owner:", deployer.address);
  console.log();

  // Contract addresses
  const NFT_ADDRESS = "0xd5B14514255B6a6B23930A9D779414D59aA4D64b";
  const MARKETPLACE_ADDRESS = "0x6381858ddC6bBcb758C23608636f53f1C577E4e2";

  const USDT_ADDRESS = "0x5734cD44e4DEe7Ec47a00d89a432d9a545a093fC";
  const IDRX_ADDRESS = "0xEF226b25263F1688cD370b558f6e3B89975F097E";

  // Get contracts
  const mockNFT = await ethers.getContractAt("MockNFT", NFT_ADDRESS);
  const marketplace = await ethers.getContractAt(
    "SimpleNFTMarketplace",
    MARKETPLACE_ADDRESS
  );

  console.log("📦 Contracts:");
  console.log("NFT:", NFT_ADDRESS);
  console.log("Marketplace:", MARKETPLACE_ADDRESS);
  console.log("USDT:", USDT_ADDRESS);
  console.log("IDRX:", IDRX_ADDRESS);
  console.log();

  // NFT pricing (example prices)
  const listings = [
    { tokenId: 1, name: "Hypurr #14", price: "100", token: "USDT" },
    { tokenId: 2, name: "Hypurr #17", price: "2000000", token: "IDRX" },
    { tokenId: 3, name: "Hypurr #22", price: "500000", token: "IDRX" },
    { tokenId: 4, name: "Hypurr #3", price: "150", token: "USDT" },
    { tokenId: 5, name: "Hypurr #35", price: "100", token: "USDT" },
    { tokenId: 6, name: "Hypurr #37", price: "50", token: "USDT" },
    { tokenId: 7, name: "Hypurr #46", price: "200", token: "USDT" },
    { tokenId: 8, name: "Hypurr #5", price: "150", token: "USDT" },
    { tokenId: 9, name: "Hypurr #61", price: "100", token: "USDT" },
    { tokenId: 10, name: "Hypurr #63", price: "10000000", token: "IDRX" },
    { tokenId: 11, name: "Hypurr #7", price: "150", token: "USDT" },
    { tokenId: 12, name: "Hypurr #8", price: "200", token: "USDT" },
  ];

  // Step 1: Approve marketplace
  console.log("🔐 Step 1: Approving marketplace for NFT transfers...");
  const isApproved = await mockNFT.isApprovedForAll(
    deployer.address,
    MARKETPLACE_ADDRESS
  );

  if (!isApproved) {
    const approveTx = await mockNFT.setApprovalForAll(
      MARKETPLACE_ADDRESS,
      true
    );
    await approveTx.wait();
    console.log("✅ Marketplace approved");
  } else {
    console.log("✅ Marketplace already approved");
  }
  console.log();

  // Step 2: List all NFTs
  console.log("📝 Step 2: Listing NFTs...\n");

  const listingIds: number[] = [];

  for (const listing of listings) {
    console.log(`Listing ${listing.name}...`);

    // Check if already listed
    const existingListingId = await marketplace.getNFTListing(
      NFT_ADDRESS,
      listing.tokenId
    );
    if (existingListingId > 0n) {
      console.log(`⚠️  Already listed with ID: ${existingListingId}`);
      listingIds.push(Number(existingListingId));
      console.log();
      continue;
    }

    // Determine payment token and price
    const paymentToken = listing.token === "USDT" ? USDT_ADDRESS : IDRX_ADDRESS;
    const decimals = listing.token === "USDT" ? 6 : 18;
    const price = ethers.parseUnits(listing.price, decimals);

    // List NFT
    const tx = await marketplace.listNFT(
      NFT_ADDRESS,
      listing.tokenId,
      paymentToken,
      price
    );
    const receipt = await tx.wait();

    // Get listing ID from event
    const event = receipt?.logs.find(
      (log) =>
        "fragment" in log && log.fragment?.name === "NFTListed"
    );
    const listingId = event && "args" in event
      ? Number(event.args[0])
      : listingIds.length + 1;

    listingIds.push(listingId);

    console.log(`✅ Listed with ID: ${listingId}`);
    console.log(`   Price: ${listing.price} ${listing.token}`);
    console.log();
  }

  // Step 3: Summary
  console.log("=".repeat(60));
  console.log("🎉 ALL NFTs LISTED!");
  console.log("=".repeat(60));
  console.log();
  console.log("📋 Listing Summary:");
  console.log();

  listings.forEach((listing, index) => {
    console.log(`Token ID ${listing.tokenId}: ${listing.name}`);
    console.log(`  → Listing ID: ${listingIds[index]}`);
    console.log(`  → Price: ${listing.price} ${listing.token}`);
  });

  console.log();
  console.log("=".repeat(60));
  console.log();

  console.log("📝 Update App.tsx dengan mapping ini:");
  console.log();
  console.log("const TOKEN_TO_LISTING: Record<string, bigint> = {");
  listings.forEach((listing, index) => {
    console.log(
      `  "${listing.tokenId}": ${listingIds[index]}n,  // ${listing.name}`
    );
  });
  console.log("};");
  console.log();

  console.log("🚀 Next Steps:");
  console.log("1. Copy mapping di atas ke src/App.tsx (multicoyn-quick-start)");
  console.log(
    "2. Update USDT_ADDRESS dan IDRX_ADDRESS di src/contracts/config.ts"
  );
  console.log("3. Test buy NFT di frontend!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
