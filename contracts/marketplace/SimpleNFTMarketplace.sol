// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract SimpleNFTMarketplace is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // Listing ID counter
    uint256 private _listingCounter;

    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address seller;
        address paymentToken;  // USDT or IDRX address
        uint256 price;         
        bool active;
        uint256 listedAt;
    }

    // listingId => Listing
    mapping(uint256 => Listing) public listings;

    // nftContract => tokenId => listingId
    mapping(address => mapping(uint256 => uint256)) public nftListings;

    // seller => listingIds[]
    mapping(address => uint256[]) public sellerListings;

    // Events
    event NFTListed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address paymentToken,
        uint256 price
    );

    event NFTPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        address paymentToken,
        uint256 price
    );

    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller
    );

    event ListingPriceUpdated(
        uint256 indexed listingId,
        uint256 oldPrice,
        uint256 newPrice
    );

    constructor() Ownable(msg.sender) {}

    // USDT (6 decimals): 100 USDT = 100_000000
    // IDRX (18 decimals): 1,000,000 IDRX = 1000000_000000000000000000
    function listNFT(
        address nftContract,
        uint256 tokenId,
        address paymentToken,
        uint256 price
    ) external nonReentrant whenNotPaused returns (uint256 listingId) {
        require(nftContract != address(0), "SimpleNFTMarketplace: invalid NFT contract");
        require(paymentToken != address(0), "SimpleNFTMarketplace: invalid payment token");
        require(price > 0, "SimpleNFTMarketplace: price must be > 0");
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "SimpleNFTMarketplace: not NFT owner"
        );
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "SimpleNFTMarketplace: marketplace not approved"
        );

        // Check if already listed
        require(
            nftListings[nftContract][tokenId] == 0,
            "SimpleNFTMarketplace: NFT already listed"
        );

        _listingCounter++;
        listingId = _listingCounter;

        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            paymentToken: paymentToken,
            price: price,
            active: true,
            listedAt: block.timestamp
        });

        nftListings[nftContract][tokenId] = listingId;
        sellerListings[msg.sender].push(listingId);

        emit NFTListed(
            listingId,
            nftContract,
            tokenId,
            msg.sender,
            paymentToken,
            price
        );

        return listingId;
    }

    function buyNFTFor(
        uint256 listingId,
        address recipient
    ) public nonReentrant whenNotPaused {
        require(recipient != address(0), "SimpleNFTMarketplace: invalid recipient");

        Listing storage listing = listings[listingId];

        require(listing.active, "SimpleNFTMarketplace: listing not active");
        require(listing.seller != recipient, "SimpleNFTMarketplace: cannot buy own NFT");

        // Verify NFT still owned by seller
        address currentOwner = IERC721(listing.nftContract).ownerOf(listing.tokenId);
        require(currentOwner == listing.seller, "SimpleNFTMarketplace: seller no longer owns NFT");

        IERC20(listing.paymentToken).safeTransferFrom(
            msg.sender,
            listing.seller,
            listing.price
        );

        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            recipient,
            listing.tokenId
        );

        // Mark listing as inactive
        listing.active = false;
        delete nftListings[listing.nftContract][listing.tokenId];

        emit NFTPurchased(
            listingId,
            recipient,
            listing.seller,
            listing.paymentToken,
            listing.price
        );
    }

    function buyNFT(uint256 listingId) external nonReentrant whenNotPaused {
        buyNFTFor(listingId, msg.sender);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];

        require(listing.active, "SimpleNFTMarketplace: listing not active");
        require(listing.seller == msg.sender, "SimpleNFTMarketplace: not seller");

        listing.active = false;
        delete nftListings[listing.nftContract][listing.tokenId];

        emit ListingCancelled(listingId, msg.sender);
    }

    function updateListingPrice(
        uint256 listingId,
        uint256 newPrice
    ) external nonReentrant {
        Listing storage listing = listings[listingId];

        require(listing.active, "SimpleNFTMarketplace: listing not active");
        require(listing.seller == msg.sender, "SimpleNFTMarketplace: not seller");
        require(newPrice > 0, "SimpleNFTMarketplace: price must be > 0");

        uint256 oldPrice = listing.price;
        listing.price = newPrice;

        emit ListingPriceUpdated(listingId, oldPrice, newPrice);
    }

    function getListing(uint256 listingId)
        external
        view
        returns (Listing memory)
    {
        return listings[listingId];
    }

    function getSellerListings(address seller)
        external
        view
        returns (uint256[] memory)
    {
        return sellerListings[seller];
    }

    function getNFTListing(address nftContract, uint256 tokenId)
        external
        view
        returns (uint256)
    {
        return nftListings[nftContract][tokenId];
    }

    function getPrice(uint256 listingId)
        external
        view
        returns (uint256 price)
    {
        Listing memory listing = listings[listingId];
        require(listing.active, "SimpleNFTMarketplace: listing not active");

        return listing.price;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
    
    struct NFTMarketData {
        uint256 tokenId;
        string tokenURI;
        uint256 listingId;
        bool hasListing;
        address seller;
        address paymentToken;
        uint256 price;
        bool active;
        uint256 listedAt;
    }

    function getAllMarketNFTs(address nftContract)
        external
        view
        returns (NFTMarketData[] memory)
    {
        uint256 totalSupply = IERC721Enumerable(nftContract).totalSupply();
        require(totalSupply > 0, "SimpleNFTMarketplace: no NFTs minted");

        uint256[] memory tokenIds = new uint256[](totalSupply);
        for (uint256 i = 0; i < totalSupply; i++) {
            tokenIds[i] = i + 1; // Token IDs start from 1
        }

        return getBatchNFTMarketData(nftContract, tokenIds);
    }

    function getBatchNFTMarketData(
        address nftContract,
        uint256[] memory tokenIds
    ) public view returns (NFTMarketData[] memory) {
        NFTMarketData[] memory result = new NFTMarketData[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            uint256 listingId = nftListings[nftContract][tokenId];

            string memory uri = "";
            try IERC721Metadata(nftContract).tokenURI(tokenId) returns (string memory _uri) {
                uri = _uri;
            } catch {
                // Token doesn't exist or error getting URI
            }

            Listing memory listing = listings[listingId];

            result[i] = NFTMarketData({
                tokenId: tokenId,
                tokenURI: uri,
                listingId: listingId,
                hasListing: listingId > 0 && listing.active,
                seller: listing.seller,
                paymentToken: listing.paymentToken,
                price: listing.price,
                active: listing.active,
                listedAt: listing.listedAt
            });
        }

        return result;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}

interface IERC721Metadata {
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC721Enumerable {
    function totalSupply() external view returns (uint256);
}
