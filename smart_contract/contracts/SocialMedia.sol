// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SocialMedia is ERC721 {
    // Thay thế Counters bằng uint256
    uint256 private _nextTokenId;

    enum MediaType {
        TEXT,
        IMAGE,
        VIDEO,
        MIXED
    }

    struct Post {
        uint256 id;
        address author;
        string contentHash; // IPFS hash cho text content
        string[] mediaHashes; // IPFS hashes cho images/videos
        MediaType mediaType;
        uint256 timestamp;
        uint256 likes;
        uint256 shares;
        uint256 nftTokenId; // NFT token ID nếu post được mint thành NFT
        bool isNFT; // Post có phải NFT không
    }

    struct Comment {
        address author;
        string contentHash;
        string mediaHash; // Optional: IPFS hash cho media trong comment
        uint256 timestamp;
    }

    mapping(uint256 => Post) public posts;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    mapping(uint256 => Comment[]) public postComments;
    mapping(uint256 => string) private _tokenURIs; // NFT metadata

    uint256 public postCount;

    event PostCreated(
        uint256 indexed postId,
        address indexed author,
        string contentHash,
        MediaType mediaType
    );
    event PostLiked(uint256 indexed postId, address indexed user);
    event PostUnliked(uint256 indexed postId, address indexed user);
    event PostShared(uint256 indexed postId, address indexed user);
    event CommentAdded(
        uint256 indexed postId,
        address indexed author,
        string contentHash
    );
    event PostMintedAsNFT(
        uint256 indexed postId,
        uint256 indexed tokenId,
        address indexed owner
    );

    constructor() ERC721("SocialMediaNFT", "SMNFT") {
        _nextTokenId = 1; // Bắt đầu từ token ID 1
    }

    // Create text-only post
    function createPost(string memory _contentHash) public returns (uint256) {
        postCount++;
        string[] memory emptyMedia;

        posts[postCount] = Post({
            id: postCount,
            author: msg.sender,
            contentHash: _contentHash,
            mediaHashes: emptyMedia,
            mediaType: MediaType.TEXT,
            timestamp: block.timestamp,
            likes: 0,
            shares: 0,
            nftTokenId: 0,
            isNFT: false
        });

        emit PostCreated(postCount, msg.sender, _contentHash, MediaType.TEXT);
        return postCount;
    }

    // Create post with media (images/videos)
    function createPostWithMedia(
        string memory _contentHash,
        string[] memory _mediaHashes,
        MediaType _mediaType
    ) public returns (uint256) {
        require(_mediaHashes.length > 0, "No media provided");
        require(
            _mediaType == MediaType.IMAGE ||
                _mediaType == MediaType.VIDEO ||
                _mediaType == MediaType.MIXED,
            "Invalid media type"
        );

        postCount++;

        posts[postCount] = Post({
            id: postCount,
            author: msg.sender,
            contentHash: _contentHash,
            mediaHashes: _mediaHashes,
            mediaType: _mediaType,
            timestamp: block.timestamp,
            likes: 0,
            shares: 0,
            nftTokenId: 0,
            isNFT: false
        });

        emit PostCreated(postCount, msg.sender, _contentHash, _mediaType);
        return postCount;
    }

    // Mint post as NFT
    function mintPostAsNFT(uint256 _postId) public returns (uint256) {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(posts[_postId].author == msg.sender, "Only author can mint");
        require(!posts[_postId].isNFT, "Already minted as NFT");

        uint256 newTokenId = _nextTokenId;
        _nextTokenId++; // Increment token ID

        _mint(msg.sender, newTokenId);

        // Set NFT metadata (IPFS hash)
        _tokenURIs[newTokenId] = posts[_postId].contentHash;

        // Update post
        posts[_postId].nftTokenId = newTokenId;
        posts[_postId].isNFT = true;

        emit PostMintedAsNFT(_postId, newTokenId, msg.sender);
        return newTokenId;
    }

    // Get NFT metadata URI
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return string(abi.encodePacked("ipfs://", _tokenURIs[tokenId]));
    }

    function likePost(uint256 _postId) public {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(!hasLiked[_postId][msg.sender], "Already liked");

        posts[_postId].likes++;
        hasLiked[_postId][msg.sender] = true;

        emit PostLiked(_postId, msg.sender);
    }

    function unlikePost(uint256 _postId) public {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(hasLiked[_postId][msg.sender], "Not liked yet");

        posts[_postId].likes--;
        hasLiked[_postId][msg.sender] = false;

        emit PostUnliked(_postId, msg.sender);
    }

    function sharePost(uint256 _postId) public {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");

        posts[_postId].shares++;

        emit PostShared(_postId, msg.sender);
    }

    // Add text comment
    function addComment(uint256 _postId, string memory _contentHash) public {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");

        postComments[_postId].push(
            Comment({
                author: msg.sender,
                contentHash: _contentHash,
                mediaHash: "",
                timestamp: block.timestamp
            })
        );

        emit CommentAdded(_postId, msg.sender, _contentHash);
    }

    // Add comment with media
    function addCommentWithMedia(
        uint256 _postId,
        string memory _contentHash,
        string memory _mediaHash
    ) public {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");

        postComments[_postId].push(
            Comment({
                author: msg.sender,
                contentHash: _contentHash,
                mediaHash: _mediaHash,
                timestamp: block.timestamp
            })
        );

        emit CommentAdded(_postId, msg.sender, _contentHash);
    }

    function getPost(uint256 _postId) public view returns (Post memory) {
        return posts[_postId];
    }

    function getPostMediaHashes(
        uint256 _postId
    ) public view returns (string[] memory) {
        return posts[_postId].mediaHashes;
    }

    function getComments(
        uint256 _postId
    ) public view returns (Comment[] memory) {
        return postComments[_postId];
    }

    function getUserLiked(
        uint256 _postId,
        address _user
    ) public view returns (bool) {
        return hasLiked[_postId][_user];
    }

    function getMediaType(uint256 _postId) public view returns (MediaType) {
        return posts[_postId].mediaType;
    }

    // Check if post is NFT
    function isPostNFT(uint256 _postId) public view returns (bool) {
        return posts[_postId].isNFT;
    }

    // Get NFT token ID of post
    function getPostNFTTokenId(uint256 _postId) public view returns (uint256) {
        require(posts[_postId].isNFT, "Post is not an NFT");
        return posts[_postId].nftTokenId;
    }

    // Get total NFTs minted
    function totalNFTsMinted() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    // Get next token ID
    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }
}