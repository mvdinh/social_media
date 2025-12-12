// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StoryManager {
    struct Story {
        uint256 id;
        address owner;
        string ipfsHash;
        uint256 timestamp;
        bool exists;
    }

    mapping(uint256 => Story) public stories;
    uint256 public storyCount = 0;
    uint256 public constant LIFETIME = 24 hours; // Thời gian tồn tại 24h

    event StoryPosted(uint256 id, address owner, string ipfsHash);
    event StoryDeleted(uint256 id, address deletedBy);
    event StoryExpired(uint256 id);

    //Đăng story mới
    function postStory(string memory _ipfsHash) public {
        storyCount++;
        stories[storyCount] = Story({
            id: storyCount,
            owner: msg.sender,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            exists: true
        });

        emit StoryPosted(storyCount, msg.sender, _ipfsHash);
    }

    //Xóa story
    function deleteStory(uint256 _id) public {
        Story storage story = stories[_id];
        require(story.exists, "Story not found");

        bool expired = block.timestamp >= story.timestamp + LIFETIME;

        if (!expired) {
            require(msg.sender == story.owner, "Not your story!");
        }

        delete stories[_id];
        emit StoryDeleted(_id, msg.sender);

        if (expired) {
            emit StoryExpired(_id);
        }
    }

    //Lấy thông tin story
    function getStory(uint256 _id) public view returns (Story memory) {
        return stories[_id];
    }
}
