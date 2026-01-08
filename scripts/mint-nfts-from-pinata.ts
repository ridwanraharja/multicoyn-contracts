import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Script untuk mint 12 NFTs dengan gambar dari Pinata
 *
 * SETUP:
 * 1. Ganti FOLDER_CID dengan CID folder Pinata Anda
 * 2. Deploy NFT contract terlebih dahulu
 * 3. Run script ini
 */

async function main() {
  console.log("🎨 Minting NFTs with Pinata Images\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // ============================================
  // CONFIGURATION - UPDATE THESE VALUES
  // ============================================

  // CID folder Pinata (Hypurr images)
  const FOLDER_CID = "bafybeibftx276scydqqhzte2eennb74zm4es6ispfznc5juiui53k3gi6i";

  // NFT Contract Address (dari deploy script)
  const NFT_ADDRESS = process.env.MOCK_NFT_ADDRESS || "";

  // Image filenames di Pinata (sesuai dengan yang Anda upload)
  const imageFiles = [
    "hypurr#14.avif",
    "hypurr#17.avif",
    "hypurr#22.avif",
    "hypurr#3.avif",
    "hypurr#35.avif",
    "hypurr#37.avif",
    "hypurr#46.avif",
    "hypurr#5.avif",
    "hypurr#61.avif",
    "hypurr#63.avif",
    "hypurr#7.avif",
    "hypurr#8.avif",
  ];

  // NFT Metadata
  const nftMetadata = [
    { name: "Hypurr #14", description: "A rare Hypurr collectible", rarity: "Rare" },
    { name: "Hypurr #17", description: "A legendary Hypurr collectible", rarity: "Legendary" },
    { name: "Hypurr #22", description: "A common Hypurr collectible", rarity: "Common" },
    { name: "Hypurr #3", description: "An epic Hypurr collectible", rarity: "Epic" },
    { name: "Hypurr #35", description: "A rare Hypurr collectible", rarity: "Rare" },
    { name: "Hypurr #37", description: "A common Hypurr collectible", rarity: "Common" },
    { name: "Hypurr #46", description: "A legendary Hypurr collectible", rarity: "Legendary" },
    { name: "Hypurr #5", description: "An epic Hypurr collectible", rarity: "Epic" },
    { name: "Hypurr #61", description: "A rare Hypurr collectible", rarity: "Rare" },
    { name: "Hypurr #63", description: "A common Hypurr collectible", rarity: "Common" },
    { name: "Hypurr #7", description: "An epic Hypurr collectible", rarity: "Epic" },
    { name: "Hypurr #8", description: "A legendary Hypurr collectible", rarity: "Legendary" },
  ];

  // ============================================
  // DEPLOY NFT CONTRACT (if needed)
  // ============================================

  let nftAddress = NFT_ADDRESS;
  let mockNFT;

  if (!nftAddress) {
    console.log("📦 Deploying MockNFT contract...\n");
    const MockNFT = await ethers.getContractFactory("MockNFT");
    mockNFT = await MockNFT.deploy("Hypurr Collection", "HYPURR");
    await mockNFT.waitForDeployment();
    nftAddress = await mockNFT.getAddress();
    console.log("✅ MockNFT deployed to:", nftAddress);
  } else {
    console.log("📦 Using existing MockNFT at:", nftAddress);
    mockNFT = await ethers.getContractAt("MockNFT", nftAddress);
  }

  console.log();

  // ============================================
  // GENERATE METADATA JSONs
  // ============================================

  console.log("📝 Generating metadata JSONs...\n");

  const metadataDir = path.join(__dirname, "../metadata");
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }

  const metadataURIs: string[] = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const metadata = {
      name: nftMetadata[i].name,
      description: nftMetadata[i].description,
      image: `ipfs://${FOLDER_CID}/${encodeURIComponent(imageFiles[i])}`,
      attributes: [
        {
          trait_type: "Rarity",
          value: nftMetadata[i].rarity
        },
        {
          trait_type: "Collection",
          value: "Hypurr"
        },
        {
          trait_type: "Number",
          value: imageFiles[i].match(/#(\d+)/)?.[1] || (i + 1).toString()
        }
      ]
    };

    // Save metadata to file
    const metadataPath = path.join(metadataDir, `${i + 1}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`✅ Generated metadata ${i + 1}/12: ${nftMetadata[i].name}`);

    // For now, we'll use IPFS gateway URL
    // TODO: Upload these JSONs to Pinata and use IPFS URIs
    // metadataURIs.push(`ipfs://METADATA_CID/${i + 1}.json`);

    // Temporary: Use base64 encoded metadata (fully on-chain)
    const metadataJSON = JSON.stringify(metadata);
    const base64Metadata = Buffer.from(metadataJSON).toString('base64');
    const dataURI = `data:application/json;base64,${base64Metadata}`;
    metadataURIs.push(dataURI);
  }

  console.log("\n📁 Metadata files saved to:", metadataDir);
  console.log("⚠️  IMPORTANT: You should upload these JSON files to Pinata!");
  console.log("   Then update the script to use IPFS URIs instead of base64\n");

  // ============================================
  // MINT NFTs
  // ============================================

  console.log("🎨 Minting 12 NFTs...\n");

  const mintedTokens: number[] = [];

  for (let i = 0; i < metadataURIs.length; i++) {
    console.log(`Minting NFT ${i + 1}/12: ${nftMetadata[i].name}...`);

    const tx = await mockNFT.mint(deployer.address, metadataURIs[i]);
    const receipt = await tx.wait();

    // Get token ID from event
    const tokenId = i + 1; // Assuming sequential minting
    mintedTokens.push(tokenId);

    console.log(`✅ Minted Token ID: ${tokenId}`);
    console.log(`   Image: ipfs://${FOLDER_CID}/${imageFiles[i]}`);
    console.log();
  }

  // ============================================
  // SUMMARY
  // ============================================

  console.log("=".repeat(60));
  console.log("🎉 MINTING COMPLETE!");
  console.log("=".repeat(60));
  console.log(`NFT Contract: ${nftAddress}`);
  console.log(`Total Minted: ${mintedTokens.length} NFTs`);
  console.log(`Owner: ${deployer.address}`);
  console.log();
  console.log("Token IDs:", mintedTokens.join(", "));
  console.log("=".repeat(60));

  console.log("\n📝 Next Steps:");
  console.log("1. Upload metadata JSON files from ./metadata/ to Pinata");
  console.log("2. Get the METADATA_CID from Pinata");
  console.log("3. Update script to use ipfs://METADATA_CID/{id}.json");
  console.log("4. Or keep using base64 (fully on-chain, but expensive)");
  console.log();
  console.log("💡 To view NFTs:");
  console.log("- Import in MetaMask Mobile (contract + token IDs)");
  console.log("- View on block explorer");
  console.log("- List on marketplace!");

  console.log("\n📁 Save these to .env:");
  console.log(`MOCK_NFT_ADDRESS=${nftAddress}`);
  console.log(`FOLDER_CID=${FOLDER_CID}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
