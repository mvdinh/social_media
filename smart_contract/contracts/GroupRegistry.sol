// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GroupRegistry {
    event GroupCreated(uint256 indexed groupId, address indexed owner);
    event MemberAdded(uint256 indexed groupId, address indexed member);
    event MemberRemoved(uint256 indexed groupId, address indexed member);
    event AdminAdded(uint256 indexed groupId, address indexed admin);
    event AdminRemoved(uint256 indexed groupId, address indexed admin);

    struct GroupInfo {
        address owner;
        bool exists;
    }

    uint256 private _groupIdCounter;

    mapping(uint256 => GroupInfo) public groups;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(uint256 => mapping(address => bool)) public isAdmin;

    modifier onlyOwner(uint256 groupId) {
        require(groups[groupId].exists, "Group not exist");
        require(groups[groupId].owner == msg.sender, "Not owner");
        _;
    }

    modifier onlyAdmin(uint256 groupId) {
        require(
            groups[groupId].owner == msg.sender || isAdmin[groupId][msg.sender],
            "Not admin"
        );
        _;
    }

    // ================= CREATE GROUP =================
    function createGroup() external returns (uint256) {
        _groupIdCounter++;
        uint256 id = _groupIdCounter;

        groups[id] = GroupInfo(msg.sender, true);
        isMember[id][msg.sender] = true;

        emit GroupCreated(id, msg.sender);
        emit MemberAdded(id, msg.sender);

        return id;
    }

    // ================= ADMIN =================
    function addAdmin(
        uint256 groupId,
        address user
    ) external onlyOwner(groupId) {
        require(isMember[groupId][user], "User not member");
        isAdmin[groupId][user] = true;
        emit AdminAdded(groupId, user);
    }

    function removeAdmin(
        uint256 groupId,
        address user
    ) external onlyOwner(groupId) {
        isAdmin[groupId][user] = false;
        emit AdminRemoved(groupId, user);
    }

    // ================= MEMBERSHIP =================
    function addMember(
        uint256 groupId,
        address user
    ) external onlyAdmin(groupId) {
        require(!isMember[groupId][user], "Already member");
        isMember[groupId][user] = true;
        emit MemberAdded(groupId, user);
    }

    function removeMember(
        uint256 groupId,
        address user
    ) external onlyAdmin(groupId) {
        require(isMember[groupId][user], "Not member");
        isMember[groupId][user] = false;
        emit MemberRemoved(groupId, user);
    }

    function leaveGroup(uint256 groupId) external {
        require(isMember[groupId][msg.sender], "Not member");
        require(groups[groupId].owner != msg.sender, "Owner cannot leave");
        isMember[groupId][msg.sender] = false;
        emit MemberRemoved(groupId, msg.sender);
    }

    // ================= VIEW =================
    function checkMembership(
        uint256 groupId,
        address user
    ) external view returns (bool) {
        return isMember[groupId][user];
    }

    function checkOwnership(
        uint256 groupId,
        address user
    ) external view returns (bool) {
        return groups[groupId].owner == user;
    }

    function checkAdmin(
        uint256 groupId,
        address user
    ) external view returns (bool) {
        return isAdmin[groupId][user];
    }
}
