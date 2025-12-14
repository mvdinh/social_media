// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GroupRegistry {
    // Sự kiện để Backend lắng nghe và index dữ liệu
    event GroupCreated(uint256 indexed groupId, address indexed owner);
    event MemberAdded(uint256 indexed groupId, address indexed member);
    event MemberRemoved(uint256 indexed groupId, address indexed member);

    struct GroupInfo {
        address owner;
        bool exists;
    }

    uint256 private _groupIdCounter;
    mapping(uint256 => GroupInfo) public groups;

    // Mapping: GroupId => UserAddress => IsMember
    mapping(uint256 => mapping(address => bool)) public isMember;

    modifier onlyGroupOwner(uint256 groupId) {
        require(groups[groupId].exists, "Group does not exist");
        require(groups[groupId].owner == msg.sender, "Not the group owner");
        _;
    }

    // 1. Tạo nhóm (Chỉ tạo ID và gán Owner)
    function createGroup() external returns (uint256) {
        _groupIdCounter++;
        uint256 newGroupId = _groupIdCounter;

        groups[newGroupId] = GroupInfo({owner: msg.sender, exists: true});

        // Owner mặc định là member
        isMember[newGroupId][msg.sender] = true;

        emit GroupCreated(newGroupId, msg.sender);
        emit MemberAdded(newGroupId, msg.sender);

        return newGroupId;
    }

    // 2. Thêm thành viên (Dùng cho Public Join hoặc Approve Private Request)
    function addMember(uint256 groupId, address user) external {
        // Logic mở rộng: Nếu group Public -> ai cũng gọi được.
        // Nếu Private -> Chỉ Owner gọi.
        // Để đơn giản ở đây ta giả định Owner duyệt (cho Private) hoặc User tự join (cần sửa logic chút tùy business)

        // Ví dụ: Hàm này dành cho Owner duyệt người khác vào
        require(
            groups[groupId].owner == msg.sender,
            "Only owner can add members"
        );
        require(!isMember[groupId][user], "Already a member");

        isMember[groupId][user] = true;
        emit MemberAdded(groupId, user);
    }

    // 3. User tự join (Cho Group Public)
    function joinPublicGroup(uint256 groupId) external {
        // Cần kết hợp logic kiểm tra xem group này có public không?
        // (Lưu ý: Type Public/Private thường lưu Offchain để tiết kiệm gas,
        // nhưng nếu muốn trustless hoàn toàn thì lưu 1 biến bool isPrivate ở struct)
        require(!isMember[groupId][msg.sender], "Already a member");
        isMember[groupId][msg.sender] = true;
        emit MemberAdded(groupId, msg.sender);
    }

    // 4. Xóa thành viên
    function removeMember(
        uint256 groupId,
        address user
    ) external onlyGroupOwner(groupId) {
        require(isMember[groupId][user], "Not a member");
        isMember[groupId][user] = false;
        emit MemberRemoved(groupId, user);
    }

    // ============ VIEW FUNCTIONS (Backend gọi cái này để check quyền) ============

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
}
