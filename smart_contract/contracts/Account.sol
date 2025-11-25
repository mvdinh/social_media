// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Account {
    struct UserProfile {
        address userAddress;
        string username;
        string bio;
        string avatarHash; // IPFS hash của avatar
        string coverHash; // IPFS hash của cover image
        uint256 registeredAt;
        bool isActive;
    }

    // Mapping address => UserProfile
    mapping(address => UserProfile) private profiles;

    // Mapping username => address (để check username unique)
    mapping(string => address) private usernameToAddress;

    // Danh sách tất cả users đã đăng ký
    address[] private allUsers;

    // Check user đã đăng ký chưa
    mapping(address => bool) private isRegistered;

    // =========================
    // REGISTER USER
    // =========================

    /**
     * @dev Đăng ký tài khoản mới - tự động khi user đăng nhập lần đầu
     */
    function register() external {
        require(!isRegistered[msg.sender], "Da dang ky roi");

        // Tạo username mặc định từ address
        string memory defaultUsername = _addressToString(msg.sender);

        profiles[msg.sender] = UserProfile({
            userAddress: msg.sender,
            username: defaultUsername,
            bio: "",
            avatarHash: "",
            coverHash: "",
            registeredAt: block.timestamp,
            isActive: true
        });

        isRegistered[msg.sender] = true;
        allUsers.push(msg.sender);

        emit UserRegistered(msg.sender, defaultUsername, block.timestamp);
    }

    /**
     * @dev Đăng ký với username tùy chỉnh
     */
    function registerWithUsername(string memory username) external {
        require(!isRegistered[msg.sender], "Da dang ky roi");
        require(
            bytes(username).length >= 3 && bytes(username).length <= 20,
            "Username phai tu 3-20 ky tu"
        );
        require(
            usernameToAddress[username] == address(0),
            "Username da ton tai"
        );

        profiles[msg.sender] = UserProfile({
            userAddress: msg.sender,
            username: username,
            bio: "",
            avatarHash: "",
            coverHash: "",
            registeredAt: block.timestamp,
            isActive: true
        });

        usernameToAddress[username] = msg.sender;
        isRegistered[msg.sender] = true;
        allUsers.push(msg.sender);

        emit UserRegistered(msg.sender, username, block.timestamp);
    }

    // =========================
    // UPDATE PROFILE
    // =========================

    /**
     * @dev Cập nhật username
     */
    function updateUsername(string memory newUsername) external {
        require(isRegistered[msg.sender], "Chua dang ky");
        require(
            bytes(newUsername).length >= 3 && bytes(newUsername).length <= 20,
            "Username phai tu 3-20 ky tu"
        );
        require(
            usernameToAddress[newUsername] == address(0),
            "Username da ton tai"
        );

        // Xóa username cũ
        string memory oldUsername = profiles[msg.sender].username;
        if (
            bytes(oldUsername).length > 0 &&
            usernameToAddress[oldUsername] == msg.sender
        ) {
            delete usernameToAddress[oldUsername];
        }

        // Set username mới
        profiles[msg.sender].username = newUsername;
        usernameToAddress[newUsername] = msg.sender;

        emit UsernameUpdated(
            msg.sender,
            oldUsername,
            newUsername,
            block.timestamp
        );
    }

    /**
     * @dev Cập nhật bio
     */
    function updateBio(string memory newBio) external {
        require(isRegistered[msg.sender], "Chua dang ky");
        require(bytes(newBio).length <= 200, "Bio qua dai (max 200 ky tu)");

        profiles[msg.sender].bio = newBio;

        emit BioUpdated(msg.sender, newBio, block.timestamp);
    }

    /**
     * @dev Cập nhật avatar (IPFS hash)
     */
    function updateAvatar(string memory avatarHash) external {
        require(isRegistered[msg.sender], "Chua dang ky");

        profiles[msg.sender].avatarHash = avatarHash;

        emit AvatarUpdated(msg.sender, avatarHash, block.timestamp);
    }

    /**
     * @dev Cập nhật cover image (IPFS hash)
     */
    function updateCover(string memory coverHash) external {
        require(isRegistered[msg.sender], "Chua dang ky");

        profiles[msg.sender].coverHash = coverHash;

        emit CoverUpdated(msg.sender, coverHash, block.timestamp);
    }

    /**
     * @dev Cập nhật toàn bộ profile
     */
    function updateProfile(
        string memory username,
        string memory bio,
        string memory avatarHash,
        string memory coverHash
    ) external {
        require(isRegistered[msg.sender], "Chua dang ky");

        // Update username nếu khác với hiện tại
        if (
            keccak256(bytes(username)) !=
            keccak256(bytes(profiles[msg.sender].username))
        ) {
            require(
                bytes(username).length >= 3 && bytes(username).length <= 20,
                "Username phai tu 3-20 ky tu"
            );
            require(
                usernameToAddress[username] == address(0),
                "Username da ton tai"
            );

            string memory oldUsername = profiles[msg.sender].username;
            if (usernameToAddress[oldUsername] == msg.sender) {
                delete usernameToAddress[oldUsername];
            }

            profiles[msg.sender].username = username;
            usernameToAddress[username] = msg.sender;
        }

        require(bytes(bio).length <= 200, "Bio qua dai (max 200 ky tu)");

        profiles[msg.sender].bio = bio;
        profiles[msg.sender].avatarHash = avatarHash;
        profiles[msg.sender].coverHash = coverHash;

        emit ProfileUpdated(msg.sender, block.timestamp);
    }

    // =========================
    // DEACTIVATE / ACTIVATE
    // =========================

    /**
     * @dev Vô hiệu hóa tài khoản (soft delete)
     */
    function deactivateAccount() external {
        require(isRegistered[msg.sender], "Chua dang ky");
        require(profiles[msg.sender].isActive, "Tai khoan da bi vo hieu hoa");

        profiles[msg.sender].isActive = false;

        emit AccountDeactivated(msg.sender, block.timestamp);
    }

    /**
     * @dev Kích hoạt lại tài khoản
     */
    function activateAccount() external {
        require(isRegistered[msg.sender], "Chua dang ky");
        require(!profiles[msg.sender].isActive, "Tai khoan dang hoat dong");

        profiles[msg.sender].isActive = true;

        emit AccountActivated(msg.sender, block.timestamp);
    }

    // =========================
    // READ FUNCTIONS
    // =========================

    /**
     * @dev Lấy profile của một user
     */
    function getProfile(
        address user
    ) external view returns (UserProfile memory) {
        require(isRegistered[user], "User chua dang ky");
        return profiles[user];
    }

    /**
     * @dev Lấy profile của chính mình
     */
    function getMyProfile() external view returns (UserProfile memory) {
        require(isRegistered[msg.sender], "Chua dang ky");
        return profiles[msg.sender];
    }

    /**
     * @dev Kiểm tra user đã đăng ký chưa
     */
    function isUserRegistered(address user) external view returns (bool) {
        return isRegistered[user];
    }

    /**
     * @dev Lấy address từ username
     */
    function getAddressByUsername(
        string memory username
    ) external view returns (address) {
        address user = usernameToAddress[username];
        require(user != address(0), "Username khong ton tai");
        return user;
    }

    /**
     * @dev Kiểm tra username có khả dụng không
     */
    function isUsernameAvailable(
        string memory username
    ) external view returns (bool) {
        return usernameToAddress[username] == address(0);
    }

    /**
     * @dev Lấy danh sách tất cả users đã đăng ký
     */
    function getAllUsers() external view returns (address[] memory) {
        return allUsers;
    }

    /**
     * @dev Lấy danh sách users đang active
     */
    function getActiveUsers() external view returns (address[] memory) {
        uint256 activeCount = 0;

        // Đếm số users active
        for (uint256 i = 0; i < allUsers.length; i++) {
            if (profiles[allUsers[i]].isActive) {
                activeCount++;
            }
        }

        // Tạo mảng active users
        address[] memory activeUsers = new address[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allUsers.length; i++) {
            if (profiles[allUsers[i]].isActive) {
                activeUsers[index] = allUsers[i];
                index++;
            }
        }

        return activeUsers;
    }

    /**
     * @dev Lấy tổng số users
     */
    function getTotalUsers() external view returns (uint256) {
        return allUsers.length;
    }

    /**
     * @dev Lấy username từ address
     */
    function getUsername(address user) external view returns (string memory) {
        require(isRegistered[user], "User chua dang ky");
        return profiles[user].username;
    }

    /**
     * @dev Lấy avatar hash từ address
     */
    function getAvatar(address user) external view returns (string memory) {
        require(isRegistered[user], "User chua dang ky");
        return profiles[user].avatarHash;
    }

    // =========================
    // INTERNAL HELPERS
    // =========================

    /**
     * @dev Convert address sang string để làm username mặc định
     */
    function _addressToString(
        address _addr
    ) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    // =========================
    // EVENTS
    // =========================

    event UserRegistered(
        address indexed user,
        string username,
        uint256 timestamp
    );
    event UsernameUpdated(
        address indexed user,
        string oldUsername,
        string newUsername,
        uint256 timestamp
    );
    event BioUpdated(address indexed user, string bio, uint256 timestamp);
    event AvatarUpdated(
        address indexed user,
        string avatarHash,
        uint256 timestamp
    );
    event CoverUpdated(
        address indexed user,
        string coverHash,
        uint256 timestamp
    );
    event ProfileUpdated(address indexed user, uint256 timestamp);
    event AccountDeactivated(address indexed user, uint256 timestamp);
    event AccountActivated(address indexed user, uint256 timestamp);
}
