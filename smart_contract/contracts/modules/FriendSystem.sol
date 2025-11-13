// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FriendSystem {
    enum RequestStatus {
        NONE,
        PENDING,
        ACCEPTED
    }

    // Track all friendships
    mapping(address => mapping(address => RequestStatus)) public friendships;

    // Track all users who have sent a friend request
    mapping(address => address[]) private pendingRequests;

    // Track friend requests sent by a user
    mapping(address => address[]) private sentRequests;

    // Track friends for each user
    mapping(address => address[]) private friendsList;

    // Track all users in the system
    address[] private allUsers;
    mapping(address => bool) private userExists;

    // Events
    event FriendRequestSent(address indexed from, address indexed to);
    event FriendRequestAccepted(address indexed from, address indexed to);
    event FriendRequestRejected(address indexed from, address indexed to);
    event FriendRequestCancelled(address indexed from, address indexed to);
    event Unfriended(address indexed user1, address indexed user2);

    // ======================
    // Send friend request
    // ======================
    function sendFriendRequest(address _to) external {
        require(_to != msg.sender, "Can't friend yourself");
        require(_to != address(0), "Invalid address");
        require(
            friendships[msg.sender][_to] == RequestStatus.NONE,
            "Already sent or friends"
        );

        // Add sender to allUsers if first time
        if (!userExists[msg.sender]) {
            allUsers.push(msg.sender);
            userExists[msg.sender] = true;
        }
        if (!userExists[_to]) {
            allUsers.push(_to);
            userExists[_to] = true;
        }

        friendships[msg.sender][_to] = RequestStatus.PENDING;
        pendingRequests[_to].push(msg.sender);
        sentRequests[msg.sender].push(_to);

        emit FriendRequestSent(msg.sender, _to);
    }

    // ======================
    // Accept friend request
    // ======================
    function acceptFriendRequest(address _from) external {
        require(_from != address(0), "Invalid address");
        require(
            friendships[_from][msg.sender] == RequestStatus.PENDING,
            "No pending request"
        );
        require(
            friendships[msg.sender][_from] != RequestStatus.ACCEPTED,
            "Already friends"
        );

        // Update friendship status
        friendships[_from][msg.sender] = RequestStatus.ACCEPTED;
        friendships[msg.sender][_from] = RequestStatus.ACCEPTED;

        // Update friendsList
        friendsList[_from].push(msg.sender);
        friendsList[msg.sender].push(_from);

        // Remove from pendingRequests and sentRequests
        removeFromArray(pendingRequests[msg.sender], _from);
        removeFromArray(sentRequests[_from], msg.sender);

        emit FriendRequestAccepted(_from, msg.sender);
    }

    // ======================
    // Reject friend request
    // ======================
    function rejectFriendRequest(address _from) external {
        require(_from != address(0), "Invalid address");
        require(
            friendships[_from][msg.sender] == RequestStatus.PENDING,
            "No pending request"
        );

        friendships[_from][msg.sender] = RequestStatus.NONE;

        removeFromArray(pendingRequests[msg.sender], _from);
        removeFromArray(sentRequests[_from], msg.sender);

        emit FriendRequestRejected(_from, msg.sender);
    }

    // ======================
    // Cancel friend request
    // ======================
    function cancelFriendRequest(address _to) external {
        require(_to != address(0), "Invalid address");
        require(
            friendships[msg.sender][_to] == RequestStatus.PENDING,
            "No pending request to cancel"
        );

        friendships[msg.sender][_to] = RequestStatus.NONE;

        removeFromArray(pendingRequests[_to], msg.sender);
        removeFromArray(sentRequests[msg.sender], _to);

        emit FriendRequestCancelled(msg.sender, _to);
    }

    // ======================
    // Unfriend
    // ======================
    function unfriend(address _friend) external {
        require(_friend != address(0), "Invalid address");
        require(
            friendships[msg.sender][_friend] == RequestStatus.ACCEPTED,
            "Not friends"
        );

        friendships[msg.sender][_friend] = RequestStatus.NONE;
        friendships[_friend][msg.sender] = RequestStatus.NONE;

        removeFromArray(friendsList[msg.sender], _friend);
        removeFromArray(friendsList[_friend], msg.sender);

        emit Unfriended(msg.sender, _friend);
    }

    // ======================
    // Get all friends of a user
    // ======================
    function getAllFriends(
        address _user
    ) external view returns (address[] memory) {
        return friendsList[_user];
    }

    // ======================
    // Get all pending requests received by _user
    // ======================
    function getAllPendingRequests(
        address _user
    ) external view returns (address[] memory) {
        return pendingRequests[_user];
    }

    // ======================
    // Get all friend requests sent by _user
    // ======================
    function getAllSentRequests(
        address _user
    ) external view returns (address[] memory) {
        return sentRequests[_user];
    }

    // ======================
    // Get friendship status between two users
    // ======================
    function getFriendshipStatus(
        address _user1,
        address _user2
    ) external view returns (RequestStatus) {
        return friendships[_user1][_user2];
    }

    // ======================
    // Check if two users are friends
    // ======================
    function areFriends(
        address _user1,
        address _user2
    ) external view returns (bool) {
        return friendships[_user1][_user2] == RequestStatus.ACCEPTED;
    }

    // ======================
    // Get total number of friends
    // ======================
    function getFriendCount(address _user) external view returns (uint256) {
        return friendsList[_user].length;
    }

    // ======================
    // Get all registered users (for testing/admin purposes)
    // ======================
    function getAllUsers() external view returns (address[] memory) {
        return allUsers;
    }

    // ======================
    // Helper: Remove address from array (swap and pop)
    // ======================
    function removeFromArray(address[] storage _array, address _addr) private {
        uint256 len = _array.length;
        if (len == 0) return;

        for (uint256 i = 0; i < len; i++) {
            if (_array[i] == _addr) {
                _array[i] = _array[len - 1];
                _array.pop();
                break;
            }
        }
    }
}
