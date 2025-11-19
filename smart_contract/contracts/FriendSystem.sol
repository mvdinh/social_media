// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FriendSystem {
    enum RequestStatus {
        NONE,
        PENDING,
        ACCEPTED
    }

    // friendships[A][B] = status giữa A → B
    mapping(address => mapping(address => RequestStatus)) public friendships;

    // pendingReceived[A] = danh sách B đã gửi request → A
    mapping(address => address[]) private pendingReceived;

    // pendingSent[A] = danh sách A đã gửi request → người khác
    mapping(address => address[]) private pendingSent;

    // friends[A] = danh sách bạn bè đã accept
    mapping(address => address[]) private friends;

    // List user hệ thống (phục vụ FE)
    mapping(address => bool) private exists;
    address[] private allUsers;

    // =========================
    // INTERNAL HELPERS
    // =========================

    function _registerUser(address user) internal {
        if (!exists[user]) {
            exists[user] = true;
            allUsers.push(user);
        }
    }

    function _remove(address[] storage arr, address target) internal {
        uint256 len = arr.length;
        for (uint256 i = 0; i < len; i++) {
            if (arr[i] == target) {
                arr[i] = arr[len - 1];
                arr.pop();
                return;
            }
        }
    }

    // =========================
    // SEND REQUEST
    // =========================
    function sendFriendRequest(address to) external {
        require(to != msg.sender, "Can't friend yourself");
        require(to != address(0), "Invalid address");
        require(
            friendships[msg.sender][to] == RequestStatus.NONE,
            "Already pending or friends"
        );

        // register users
        _registerUser(msg.sender);
        _registerUser(to);

        friendships[msg.sender][to] = RequestStatus.PENDING;
        pendingReceived[to].push(msg.sender);
        pendingSent[msg.sender].push(to);

        emit FriendRequestSent(msg.sender, to);
    }

    // =========================
    // ACCEPT REQUEST
    // =========================
    function acceptFriendRequest(address from) external {
        require(
            friendships[from][msg.sender] == RequestStatus.PENDING,
            "No pending request"
        );

        friendships[from][msg.sender] = RequestStatus.ACCEPTED;
        friendships[msg.sender][from] = RequestStatus.ACCEPTED;

        friends[from].push(msg.sender);
        friends[msg.sender].push(from);

        _remove(pendingReceived[msg.sender], from);
        _remove(pendingSent[from], msg.sender);

        emit FriendRequestAccepted(from, msg.sender);
    }

    // =========================
    // REJECT REQUEST
    // =========================
    function rejectFriendRequest(address from) external {
        require(
            friendships[from][msg.sender] == RequestStatus.PENDING,
            "No pending request"
        );

        friendships[from][msg.sender] = RequestStatus.NONE;

        _remove(pendingReceived[msg.sender], from);
        _remove(pendingSent[from], msg.sender);

        emit FriendRequestRejected(from, msg.sender);
    }

    // =========================
    // CANCEL REQUEST
    // =========================
    function cancelFriendRequest(address to) external {
        require(
            friendships[msg.sender][to] == RequestStatus.PENDING,
            "No pending request to cancel"
        );

        friendships[msg.sender][to] = RequestStatus.NONE;

        _remove(pendingReceived[to], msg.sender);
        _remove(pendingSent[msg.sender], to);

        emit FriendRequestCancelled(msg.sender, to);
    }

    // =========================
    // UNFRIEND
    // =========================
    function unfriend(address friendAddr) external {
        require(
            friendships[msg.sender][friendAddr] == RequestStatus.ACCEPTED,
            "Not friends"
        );

        friendships[msg.sender][friendAddr] = RequestStatus.NONE;
        friendships[friendAddr][msg.sender] = RequestStatus.NONE;

        _remove(friends[msg.sender], friendAddr);
        _remove(friends[friendAddr], msg.sender);

        emit Unfriended(msg.sender, friendAddr);
    }

    // =========================
    // READ FUNCTIONS
    // =========================

    function getFriendshipStatus(
        address a,
        address b
    ) external view returns (RequestStatus) {
        return friendships[a][b];
    }

    function areFriends(address a, address b) external view returns (bool) {
        return friendships[a][b] == RequestStatus.ACCEPTED;
    }

    function getAllFriends(
        address user
    ) external view returns (address[] memory) {
        return friends[user];
    }

    function getAllPendingRequests(
        address user
    ) external view returns (address[] memory) {
        return pendingReceived[user];
    }

    function getAllSentRequests(
        address user
    ) external view returns (address[] memory) {
        return pendingSent[user];
    }

    function getFriendCount(address user) external view returns (uint256) {
        return friends[user].length;
    }

    function getAllUsers() external view returns (address[] memory) {
        return allUsers;
    }

    // =========================
    // EVENTS
    // =========================
    event FriendRequestSent(address indexed from, address indexed to);
    event FriendRequestAccepted(address indexed from, address indexed to);
    event FriendRequestRejected(address indexed from, address indexed to);
    event FriendRequestCancelled(address indexed from, address indexed to);
    event Unfriended(address indexed user1, address indexed user2);
}
