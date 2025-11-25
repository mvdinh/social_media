// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Relationship {
    enum FriendStatus {
        NONE, // Không có quan hệ
        PENDING, // Đang chờ chấp nhận
        ACCEPTED // Đã là bạn bè
    }

    // Trạng thái quan hệ giữa 2 người: friendships[A][B] = status từ A → B
    mapping(address => mapping(address => FriendStatus)) public friendships;

    // Danh sách lời mời đã nhận: pendingReceived[A] = [B, C, D đã gửi request cho A]
    mapping(address => address[]) private pendingReceived;

    // Danh sách lời mời đã gửi: pendingSent[A] = [A đã gửi request cho B, C, D]
    mapping(address => address[]) private pendingSent;

    // Danh sách bạn bè: friends[A] = [danh sách bạn bè của A]
    mapping(address => address[]) private friends;

    // Quản lý người dùng trong hệ thống
    mapping(address => bool) private userExists;
    address[] private allUsers;

    // =========================
    // INTERNAL HELPERS
    // =========================

    /**
     * @dev Đăng ký người dùng vào hệ thống
     */
    function _registerUser(address user) internal {
        if (!userExists[user]) {
            userExists[user] = true;
            allUsers.push(user);
        }
    }

    /**
     * @dev Xóa một địa chỉ khỏi mảng
     */
    function _removeFromArray(address[] storage arr, address target) internal {
        uint256 len = arr.length;
        for (uint256 i = 0; i < len; i++) {
            if (arr[i] == target) {
                arr[i] = arr[len - 1];
                arr.pop();
                return;
            }
        }
    }

    /**
     * @dev Kiểm tra địa chỉ có trong mảng không
     */
    function _isInArray(
        address[] memory arr,
        address target
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return true;
            }
        }
        return false;
    }

    // =========================
    // GỬI LỜI MỜI KẾT BẠN
    // =========================

    /**
     * @dev Gửi lời mời kết bạn đến một người
     * @param to Địa chỉ người nhận lời mời
     */
    function sendFriendRequest(address to) external {
        require(to != msg.sender, "Khong the ket ban voi chinh minh");
        require(to != address(0), "Dia chi khong hop le");
        require(
            friendships[msg.sender][to] == FriendStatus.NONE,
            "Da gui loi moi hoac da la ban be"
        );

        // Đăng ký người dùng
        _registerUser(msg.sender);
        _registerUser(to);

        // Cập nhật trạng thái
        friendships[msg.sender][to] = FriendStatus.PENDING;

        // Thêm vào danh sách
        pendingReceived[to].push(msg.sender);
        pendingSent[msg.sender].push(to);

        emit FriendRequestSent(msg.sender, to, block.timestamp);
    }

    // =========================
    // CHẤP NHẬN LỜI MỜI
    // =========================

    /**
     * @dev Chấp nhận lời mời kết bạn
     * @param from Địa chỉ người đã gửi lời mời
     */
    function acceptFriendRequest(address from) external {
        require(
            friendships[from][msg.sender] == FriendStatus.PENDING,
            "Khong co loi moi ket ban"
        );

        // Cập nhật trạng thái 2 chiều
        friendships[from][msg.sender] = FriendStatus.ACCEPTED;
        friendships[msg.sender][from] = FriendStatus.ACCEPTED;

        // Thêm vào danh sách bạn bè của cả 2 người
        friends[from].push(msg.sender);
        friends[msg.sender].push(from);

        // Xóa khỏi danh sách pending
        _removeFromArray(pendingReceived[msg.sender], from);
        _removeFromArray(pendingSent[from], msg.sender);

        emit FriendRequestAccepted(from, msg.sender, block.timestamp);
    }

    // =========================
    // TỪ CHỐI LỜI MỜI
    // =========================

    /**
     * @dev Từ chối lời mời kết bạn
     * @param from Địa chỉ người đã gửi lời mời
     */
    function rejectFriendRequest(address from) external {
        require(
            friendships[from][msg.sender] == FriendStatus.PENDING,
            "Khong co loi moi ket ban"
        );

        // Reset trạng thái
        friendships[from][msg.sender] = FriendStatus.NONE;

        // Xóa khỏi danh sách pending
        _removeFromArray(pendingReceived[msg.sender], from);
        _removeFromArray(pendingSent[from], msg.sender);

        emit FriendRequestRejected(from, msg.sender, block.timestamp);
    }

    // =========================
    // HỦY LỜI MỜI ĐÃ GỬI
    // =========================

    /**
     * @dev Hủy lời mời kết bạn đã gửi
     * @param to Địa chỉ người đã nhận lời mời
     */
    function cancelFriendRequest(address to) external {
        require(
            friendships[msg.sender][to] == FriendStatus.PENDING,
            "Khong co loi moi de huy"
        );

        // Reset trạng thái
        friendships[msg.sender][to] = FriendStatus.NONE;

        // Xóa khỏi danh sách pending
        _removeFromArray(pendingReceived[to], msg.sender);
        _removeFromArray(pendingSent[msg.sender], to);

        emit FriendRequestCancelled(msg.sender, to, block.timestamp);
    }

    // =========================
    // HỦY KẾT BẠN (2 CHIỀU)
    // =========================

    /**
     * @dev Hủy kết bạn - xóa quan hệ ở cả 2 chiều
     * @param friendAddress Địa chỉ bạn bè cần hủy
     */
    function unfriend(address friendAddress) external {
        require(
            friendships[msg.sender][friendAddress] == FriendStatus.ACCEPTED,
            "Khong phai ban be"
        );

        // Reset trạng thái 2 chiều
        friendships[msg.sender][friendAddress] = FriendStatus.NONE;
        friendships[friendAddress][msg.sender] = FriendStatus.NONE;

        // Xóa khỏi danh sách bạn bè của cả 2 người
        _removeFromArray(friends[msg.sender], friendAddress);
        _removeFromArray(friends[friendAddress], msg.sender);

        emit Unfriended(msg.sender, friendAddress, block.timestamp);
    }

    // =========================
    // CHẶN NGƯỜI DÙNG (BLOCK)
    // =========================

    /**
     * @dev Chặn một người dùng - tự động unfriend nếu đã là bạn
     * @param userToBlock Địa chỉ người cần chặn
     */
    function blockUser(address userToBlock) external {
        require(userToBlock != msg.sender, "Khong the chan chinh minh");
        require(userToBlock != address(0), "Dia chi khong hop le");

        // Nếu đang là bạn bè, tự động unfriend
        if (friendships[msg.sender][userToBlock] == FriendStatus.ACCEPTED) {
            friendships[msg.sender][userToBlock] = FriendStatus.NONE;
            friendships[userToBlock][msg.sender] = FriendStatus.NONE;
            _removeFromArray(friends[msg.sender], userToBlock);
            _removeFromArray(friends[userToBlock], msg.sender);
        }

        // Nếu có pending request, hủy
        if (friendships[msg.sender][userToBlock] == FriendStatus.PENDING) {
            _removeFromArray(pendingReceived[userToBlock], msg.sender);
            _removeFromArray(pendingSent[msg.sender], userToBlock);
        }
        if (friendships[userToBlock][msg.sender] == FriendStatus.PENDING) {
            _removeFromArray(pendingReceived[msg.sender], userToBlock);
            _removeFromArray(pendingSent[userToBlock], msg.sender);
        }

        emit UserBlocked(msg.sender, userToBlock, block.timestamp);
    }

    // =========================
    // READ FUNCTIONS
    // =========================

    /**
     * @dev Lấy trạng thái quan hệ giữa 2 người
     */
    function getFriendshipStatus(
        address a,
        address b
    ) external view returns (FriendStatus) {
        return friendships[a][b];
    }

    /**
     * @dev Kiểm tra 2 người có phải bạn bè không
     */
    function areFriends(address a, address b) external view returns (bool) {
        return friendships[a][b] == FriendStatus.ACCEPTED;
    }

    /**
     * @dev Lấy danh sách tất cả bạn bè
     */
    function getAllFriends(
        address user
    ) external view returns (address[] memory) {
        return friends[user];
    }

    /**
     * @dev Lấy danh sách lời mời đã nhận
     */
    function getPendingRequests(
        address user
    ) external view returns (address[] memory) {
        return pendingReceived[user];
    }

    /**
     * @dev Lấy danh sách lời mời đã gửi
     */
    function getSentRequests(
        address user
    ) external view returns (address[] memory) {
        return pendingSent[user];
    }

    /**
     * @dev Lấy số lượng bạn bè
     */
    function getFriendCount(address user) external view returns (uint256) {
        return friends[user].length;
    }

    /**
     * @dev Lấy danh sách tất cả người dùng trong hệ thống
     */
    function getAllUsers() external view returns (address[] memory) {
        return allUsers;
    }

    /**
     * @dev Lấy thông tin tổng quan về quan hệ của user
     */
    function getRelationshipSummary(
        address user
    )
        external
        view
        returns (
            uint256 friendCount,
            uint256 pendingReceivedCount,
            uint256 pendingSentCount
        )
    {
        return (
            friends[user].length,
            pendingReceived[user].length,
            pendingSent[user].length
        );
    }

    /**
     * @dev Kiểm tra người dùng có tồn tại trong hệ thống không
     */
    function isUserRegistered(address user) external view returns (bool) {
        return userExists[user];
    }

    // =========================
    // EVENTS
    // =========================

    event FriendRequestSent(
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    event FriendRequestAccepted(
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    event FriendRequestRejected(
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    event FriendRequestCancelled(
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    event Unfriended(
        address indexed user1,
        address indexed user2,
        uint256 timestamp
    );
    event UserBlocked(
        address indexed blocker,
        address indexed blocked,
        uint256 timestamp
    );
}
