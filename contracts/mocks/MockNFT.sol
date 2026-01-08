// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    // tokenId => metadata URI
    mapping(uint256 => string) private _tokenURIs;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string uri);

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {}

    function mint(address to, string memory uri) external returns (uint256) {
        require(to != address(0), "MockNFT: mint to zero address");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;

        emit NFTMinted(to, tokenId, uri);

        return tokenId;
    }

    function batchMint(
        address to,
        string[] memory uris
    ) external returns (uint256[] memory tokenIds) {
        require(to != address(0), "MockNFT: mint to zero address");
        require(uris.length > 0, "MockNFT: empty uris");
        require(uris.length <= 100, "MockNFT: too many tokens");

        tokenIds = new uint256[](uris.length);

        for (uint256 i = 0; i < uris.length; i++) {
            _tokenIdCounter++;
            uint256 tokenId = _tokenIdCounter;

            _safeMint(to, tokenId);
            _tokenURIs[tokenId] = uris[i];

            tokenIds[i] = tokenId;

            emit NFTMinted(to, tokenId, uris[i]);
        }

        return tokenIds;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
