// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SocialMedia {
    struct Post {
        uint256 id;
        address author;
        string ipfsHash;
        uint256 timestamp;
        uint256 likes;
        uint256 shares;
    }

    struct Comment {
        address author;
        string ipfsHash;
        uint256 timestamp;
    }

    mapping(uint256 => Post) public posts;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    mapping(uint256 => Comment[]) public postComments;

    uint256 public postCount;

    event PostCreated(
        uint256 indexed postId,
        address indexed author,
        string ipfsHash
    );
    event PostLiked(uint256 indexed postId, address indexed user);
    event PostUnliked(uint256 indexed postId, address indexed user);
    event PostShared(uint256 indexed postId, address indexed user);
    event CommentAdded(
        uint256 indexed postId,
        address indexed author,
        string ipfsHash
    );

    function createPost(string memory _ipfsHash) public returns (uint256) {
        postCount++;
        posts[postCount] = Post({
            id: postCount,
            author: msg.sender,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            likes: 0,
            shares: 0
        });

        emit PostCreated(postCount, msg.sender, _ipfsHash);
        return postCount;
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

    function addComment(uint256 _postId, string memory _ipfsHash) public {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");

        postComments[_postId].push(
            Comment({
                author: msg.sender,
                ipfsHash: _ipfsHash,
                timestamp: block.timestamp
            })
        );

        emit CommentAdded(_postId, msg.sender, _ipfsHash);
    }

    function getPost(uint256 _postId) public view returns (Post memory) {
        return posts[_postId];
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
}
