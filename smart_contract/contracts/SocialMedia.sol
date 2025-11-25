// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SocialMedia
 * @dev Simplified social media contract without Share feature
 */
contract SocialMedia {
    enum MediaType {
        TEXT,
        IMAGE,
        VIDEO,
        MIXED
    }

    struct Post {
        uint256 id;
        address author;
        string contentHash;
        string[] mediaHashes;
        MediaType mediaType;
        uint256 timestamp;
        uint256 likes;
        bool isDeleted;
    }

    struct Comment {
        address author;
        string contentHash;
        string mediaHash;
        uint256 timestamp;
        bool isDeleted;
    }

    mapping(uint256 => Post) public posts;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    mapping(uint256 => Comment[]) public postComments;

    uint256 public postCount;

    event PostCreated(
        uint256 indexed postId,
        address indexed author,
        string contentHash,
        MediaType mediaType
    );
    event PostDeleted(uint256 indexed postId, address indexed author);
    event PostLiked(uint256 indexed postId, address indexed user);
    event PostUnliked(uint256 indexed postId, address indexed user);
    event CommentAdded(
        uint256 indexed postId,
        address indexed author,
        string contentHash
    );
    event CommentDeleted(
        uint256 indexed postId,
        uint256 commentIndex,
        address indexed author
    );

    modifier postExists(uint256 _postId) {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(!posts[_postId].isDeleted, "Post has been deleted");
        _;
    }

    // Create text-only post
    function createPost(string memory _contentHash) public returns (uint256) {
        require(bytes(_contentHash).length > 0, "Content hash cannot be empty");

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
            isDeleted: false
        });

        emit PostCreated(postCount, msg.sender, _contentHash, MediaType.TEXT);
        return postCount;
    }

    // Create post with media
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
            isDeleted: false
        });

        emit PostCreated(postCount, msg.sender, _contentHash, _mediaType);
        return postCount;
    }

    // Delete post
    function deletePost(uint256 _postId) public postExists(_postId) {
        require(posts[_postId].author == msg.sender, "Only author can delete");

        posts[_postId].isDeleted = true;

        emit PostDeleted(_postId, msg.sender);
    }

    // Like post
    function likePost(uint256 _postId) public postExists(_postId) {
        require(!hasLiked[_postId][msg.sender], "Already liked this post");

        posts[_postId].likes++;
        hasLiked[_postId][msg.sender] = true;

        emit PostLiked(_postId, msg.sender);
    }

    // Unlike post
    function unlikePost(uint256 _postId) public postExists(_postId) {
        require(hasLiked[_postId][msg.sender], "You haven't liked this post");

        posts[_postId].likes--;
        hasLiked[_postId][msg.sender] = false;

        emit PostUnliked(_postId, msg.sender);
    }

    // Add comment
    function addComment(
        uint256 _postId,
        string memory _contentHash
    ) public postExists(_postId) {
        require(bytes(_contentHash).length > 0, "Comment cannot be empty");

        postComments[_postId].push(
            Comment({
                author: msg.sender,
                contentHash: _contentHash,
                mediaHash: "",
                timestamp: block.timestamp,
                isDeleted: false
            })
        );

        emit CommentAdded(_postId, msg.sender, _contentHash);
    }

    // Add comment with media
    function addCommentWithMedia(
        uint256 _postId,
        string memory _contentHash,
        string memory _mediaHash
    ) public postExists(_postId) {
        postComments[_postId].push(
            Comment({
                author: msg.sender,
                contentHash: _contentHash,
                mediaHash: _mediaHash,
                timestamp: block.timestamp,
                isDeleted: false
            })
        );

        emit CommentAdded(_postId, msg.sender, _contentHash);
    }

    // Delete comment
    function deleteComment(
        uint256 _postId,
        uint256 _commentIndex
    ) public postExists(_postId) {
        require(
            _commentIndex < postComments[_postId].length,
            "Comment does not exist"
        );
        require(
            postComments[_postId][_commentIndex].author == msg.sender,
            "Only author can delete comment"
        );
        require(
            !postComments[_postId][_commentIndex].isDeleted,
            "Comment already deleted"
        );

        postComments[_postId][_commentIndex].isDeleted = true;

        emit CommentDeleted(_postId, _commentIndex, msg.sender);
    }

    // ========== VIEW FUNCTIONS ==========

    function getPost(uint256 _postId) public view returns (Post memory) {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        return posts[_postId];
    }

    function getPostMediaHashes(
        uint256 _postId
    ) public view postExists(_postId) returns (string[] memory) {
        return posts[_postId].mediaHashes;
    }

    function getComments(
        uint256 _postId
    ) public view returns (Comment[] memory) {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        return postComments[_postId];
    }

    function checkIfLiked(
        uint256 _postId,
        address _user
    ) public view returns (bool) {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        return hasLiked[_postId][_user];
    }

    function getMediaType(
        uint256 _postId
    ) public view postExists(_postId) returns (MediaType) {
        return posts[_postId].mediaType;
    }

    // Get posts with pagination
    function getPosts(
        uint256 _offset,
        uint256 _limit
    ) public view returns (Post[] memory) {
        require(_offset < postCount, "Offset out of bounds");

        uint256 end = _offset + _limit;
        if (end > postCount) {
            end = postCount;
        }

        uint256 resultCount = 0;
        for (uint256 i = _offset + 1; i <= end; i++) {
            if (!posts[i].isDeleted) {
                resultCount++;
            }
        }

        Post[] memory result = new Post[](resultCount);
        uint256 index = 0;

        for (uint256 i = _offset + 1; i <= end; i++) {
            if (!posts[i].isDeleted) {
                result[index] = posts[i];
                index++;
            }
        }

        return result;
    }

    // Get user's posts
    function getUserPosts(address _user) public view returns (Post[] memory) {
        uint256 userPostCount = 0;

        for (uint256 i = 1; i <= postCount; i++) {
            if (posts[i].author == _user && !posts[i].isDeleted) {
                userPostCount++;
            }
        }

        Post[] memory userPosts = new Post[](userPostCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= postCount; i++) {
            if (posts[i].author == _user && !posts[i].isDeleted) {
                userPosts[index] = posts[i];
                index++;
            }
        }

        return userPosts;
    }
}
