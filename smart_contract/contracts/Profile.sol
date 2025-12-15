// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Profile {
    struct UserProfile {
        address owner;
        string profileHash;
        uint256 createdAt;
        uint256 lastUpdatedAt;
    }

    mapping(address => UserProfile) public userProfiles;

    mapping(address => bool) public hasProfile;

    event ProfileCreated(
        address indexed owner,
        string profileHash,
        uint256 createdAt
    );
    event ProfileUpdated(
        address indexed owner,
        string newProfileHash,
        uint256 lastUpdatedAt
    );

    function createOrUpdateProfile(string memory _profileHash) public {
        require(
            bytes(_profileHash).length > 0,
            "Profile hash cannot be empty."
        );

        if (hasProfile[msg.sender]) {
            userProfiles[msg.sender].profileHash = _profileHash;
            userProfiles[msg.sender].lastUpdatedAt = block.timestamp;
            emit ProfileUpdated(msg.sender, _profileHash, block.timestamp);
        } else {
            userProfiles[msg.sender] = UserProfile(
                msg.sender,
                _profileHash,
                block.timestamp,
                block.timestamp
            );
            hasProfile[msg.sender] = true;
            emit ProfileCreated(msg.sender, _profileHash, block.timestamp);
        }
    }

    function getProfileHash(address _user) public view returns (string memory) {
        require(hasProfile[_user], "User does not have a profile yet.");
        return userProfiles[_user].profileHash;
    }
}
