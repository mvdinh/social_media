// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SocialMedia.sol";

/**
 * @title Groups
 * @dev Quản lý nhóm cộng đồng, kế thừa từ SocialMedia để tái sử dụng chức năng post
 */
contract Groups is SocialMedia {
    enum GroupType {
        PUBLIC,
        PRIVATE
    }
    enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    struct Group {
        uint256 id;
        string name;
        string description;
        GroupType groupType;
        bool autoApprove;
        address owner;
        uint256 createdAt;
        uint256 memberCount;
        string coverImage; // Hash của ảnh bìa
        bool exists;
    }

    struct JoinRequest {
        uint256 id;
        uint256 groupId;
        address user;
        RequestStatus status;
        uint256 createdAt;
    }

    // State variables
    uint256 private groupCounter;
    uint256 private requestCounter;

    mapping(uint256 => Group) public groups;
    mapping(uint256 => mapping(address => bool)) public groupMembers;
    mapping(uint256 => uint256[]) public groupPosts; // groupId => postIds[]
    mapping(uint256 => uint256) public postToGroup; // postId => groupId
    mapping(uint256 => JoinRequest) public joinRequests;
    mapping(uint256 => uint256[]) public groupJoinRequests; // groupId => requestIds[]
    mapping(address => uint256[]) public userGroups; // user => groupIds[]

    // Events
    event GroupCreated(
        uint256 indexed groupId,
        string name,
        address owner,
        GroupType groupType
    );
    event GroupUpdated(
        uint256 indexed groupId,
        string name,
        string description
    );
    event MemberJoined(uint256 indexed groupId, address member);
    event MemberLeft(uint256 indexed groupId, address member);
    event JoinRequestCreated(
        uint256 indexed requestId,
        uint256 indexed groupId,
        address user
    );
    event JoinRequestApproved(
        uint256 indexed requestId,
        uint256 indexed groupId,
        address user
    );
    event JoinRequestRejected(
        uint256 indexed requestId,
        uint256 indexed groupId,
        address user
    );
    event GroupPostCreated(
        uint256 indexed postId,
        uint256 indexed groupId,
        address author
    );

    // Modifiers
    modifier onlyGroupOwner(uint256 _groupId) {
        require(groups[_groupId].exists, "Group does not exist");
        require(groups[_groupId].owner == msg.sender, "Only group owner");
        _;
    }

    modifier onlyGroupMember(uint256 _groupId) {
        require(groups[_groupId].exists, "Group does not exist");
        require(groupMembers[_groupId][msg.sender], "Not a member");
        _;
    }

    modifier groupExists(uint256 _groupId) {
        require(groups[_groupId].exists, "Group does not exist");
        _;
    }

    // ========== GROUP MANAGEMENT ==========

    /**
     * @dev Tạo nhóm mới
     */
    function createGroup(
        string memory _name,
        string memory _description,
        GroupType _groupType,
        bool _autoApprove,
        string memory _coverImage
    ) public returns (uint256) {
        require(bytes(_name).length > 0, "Group name cannot be empty");

        groupCounter++;
        uint256 newGroupId = groupCounter;

        groups[newGroupId] = Group({
            id: newGroupId,
            name: _name,
            description: _description,
            groupType: _groupType,
            autoApprove: _autoApprove,
            owner: msg.sender,
            createdAt: block.timestamp,
            memberCount: 1,
            coverImage: _coverImage,
            exists: true
        });

        // Thêm owner vào members
        groupMembers[newGroupId][msg.sender] = true;
        userGroups[msg.sender].push(newGroupId);

        emit GroupCreated(newGroupId, _name, msg.sender, _groupType);

        return newGroupId;
    }

    /**
     * @dev Cập nhật thông tin nhóm
     */
    function updateGroup(
        uint256 _groupId,
        string memory _name,
        string memory _description,
        string memory _coverImage
    ) public onlyGroupOwner(_groupId) {
        require(bytes(_name).length > 0, "Group name cannot be empty");

        groups[_groupId].name = _name;
        groups[_groupId].description = _description;
        groups[_groupId].coverImage = _coverImage;

        emit GroupUpdated(_groupId, _name, _description);
    }

    /**
     * @dev Cập nhật cài đặt nhóm
     */
    function updateGroupSettings(
        uint256 _groupId,
        GroupType _groupType,
        bool _autoApprove
    ) public onlyGroupOwner(_groupId) {
        groups[_groupId].groupType = _groupType;
        groups[_groupId].autoApprove = _autoApprove;
    }

    // ========== MEMBERSHIP MANAGEMENT ==========

    /**
     * @dev Yêu cầu tham gia nhóm
     */
    function requestJoinGroup(
        uint256 _groupId
    ) public groupExists(_groupId) returns (uint256) {
        require(!groupMembers[_groupId][msg.sender], "Already a member");

        Group memory group = groups[_groupId];

        // Nếu nhóm công khai và auto approve
        if (group.groupType == GroupType.PUBLIC && group.autoApprove) {
            groupMembers[_groupId][msg.sender] = true;
            groups[_groupId].memberCount++;
            userGroups[msg.sender].push(_groupId);

            emit MemberJoined(_groupId, msg.sender);
            return 0; // Không cần request
        }

        // Tạo yêu cầu tham gia
        requestCounter++;
        uint256 newRequestId = requestCounter;

        joinRequests[newRequestId] = JoinRequest({
            id: newRequestId,
            groupId: _groupId,
            user: msg.sender,
            status: RequestStatus.PENDING,
            createdAt: block.timestamp
        });

        groupJoinRequests[_groupId].push(newRequestId);

        emit JoinRequestCreated(newRequestId, _groupId, msg.sender);

        return newRequestId;
    }

    /**
     * @dev Phê duyệt yêu cầu tham gia
     */
    function approveJoinRequest(uint256 _requestId) public {
        JoinRequest storage request = joinRequests[_requestId];
        require(request.status == RequestStatus.PENDING, "Request not pending");
        require(
            groups[request.groupId].owner == msg.sender,
            "Only owner can approve"
        );

        request.status = RequestStatus.APPROVED;
        groupMembers[request.groupId][request.user] = true;
        groups[request.groupId].memberCount++;
        userGroups[request.user].push(request.groupId);

        emit JoinRequestApproved(_requestId, request.groupId, request.user);
        emit MemberJoined(request.groupId, request.user);
    }

    /**
     * @dev Từ chối yêu cầu tham gia
     */
    function rejectJoinRequest(uint256 _requestId) public {
        JoinRequest storage request = joinRequests[_requestId];
        require(request.status == RequestStatus.PENDING, "Request not pending");
        require(
            groups[request.groupId].owner == msg.sender,
            "Only owner can reject"
        );

        request.status = RequestStatus.REJECTED;

        emit JoinRequestRejected(_requestId, request.groupId, request.user);
    }

    /**
     * @dev Rời khỏi nhóm
     */
    function leaveGroup(uint256 _groupId) public onlyGroupMember(_groupId) {
        require(groups[_groupId].owner != msg.sender, "Owner cannot leave");

        groupMembers[_groupId][msg.sender] = false;
        groups[_groupId].memberCount--;

        emit MemberLeft(_groupId, msg.sender);
    }

    /**
     * @dev Xóa thành viên (chỉ owner)
     */
    function removeMember(
        uint256 _groupId,
        address _member
    ) public onlyGroupOwner(_groupId) {
        require(groupMembers[_groupId][_member], "Not a member");
        require(_member != msg.sender, "Cannot remove yourself");

        groupMembers[_groupId][_member] = false;
        groups[_groupId].memberCount--;

        emit MemberLeft(_groupId, _member);
    }

    // ========== POST IN GROUP (Kế thừa từ SocialMedia) ==========

    /**
     * @dev Tạo bài viết TEXT trong nhóm
     */
    function createGroupPost(
        uint256 _groupId,
        string memory _contentHash
    ) public onlyGroupMember(_groupId) returns (uint256) {
        // Gọi hàm createPost từ SocialMedia
        uint256 postId = createPost(_contentHash);

        // Liên kết post với group
        postToGroup[postId] = _groupId;
        groupPosts[_groupId].push(postId);

        emit GroupPostCreated(postId, _groupId, msg.sender);

        return postId;
    }

    /**
     * @dev Tạo bài viết có MEDIA trong nhóm
     */
    function createGroupPostWithMedia(
        uint256 _groupId,
        string memory _contentHash,
        string[] memory _mediaHashes,
        MediaType _mediaType
    ) public onlyGroupMember(_groupId) returns (uint256) {
        // Gọi hàm createPostWithMedia từ SocialMedia
        uint256 postId = createPostWithMedia(
            _contentHash,
            _mediaHashes,
            _mediaType
        );

        // Liên kết post với group
        postToGroup[postId] = _groupId;
        groupPosts[_groupId].push(postId);

        emit GroupPostCreated(postId, _groupId, msg.sender);

        return postId;
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @dev Lấy thông tin nhóm
     */
    function getGroup(
        uint256 _groupId
    ) public view groupExists(_groupId) returns (Group memory) {
        return groups[_groupId];
    }

    /**
     * @dev Lấy tất cả bài viết trong nhóm
     */
    function getGroupPosts(
        uint256 _groupId
    ) public view groupExists(_groupId) returns (Post[] memory) {
        uint256[] memory postIds = groupPosts[_groupId];
        uint256 validPostCount = 0;

        // Đếm số bài viết chưa bị xóa
        for (uint256 i = 0; i < postIds.length; i++) {
            if (!posts[postIds[i]].isDeleted) {
                validPostCount++;
            }
        }

        Post[] memory result = new Post[](validPostCount);
        uint256 index = 0;

        for (uint256 i = 0; i < postIds.length; i++) {
            if (!posts[postIds[i]].isDeleted) {
                result[index] = posts[postIds[i]];
                index++;
            }
        }

        return result;
    }

    /**
     * @dev Lấy danh sách yêu cầu tham gia của nhóm
     */
    function getGroupJoinRequests(
        uint256 _groupId
    ) public view onlyGroupOwner(_groupId) returns (JoinRequest[] memory) {
        uint256[] memory requestIds = groupJoinRequests[_groupId];
        uint256 pendingCount = 0;

        for (uint256 i = 0; i < requestIds.length; i++) {
            if (joinRequests[requestIds[i]].status == RequestStatus.PENDING) {
                pendingCount++;
            }
        }

        JoinRequest[] memory result = new JoinRequest[](pendingCount);
        uint256 index = 0;

        for (uint256 i = 0; i < requestIds.length; i++) {
            if (joinRequests[requestIds[i]].status == RequestStatus.PENDING) {
                result[index] = joinRequests[requestIds[i]];
                index++;
            }
        }

        return result;
    }

    /**
     * @dev Lấy danh sách nhóm của user
     */
    function getUserGroups(address _user) public view returns (Group[] memory) {
        uint256[] memory groupIds = userGroups[_user];
        Group[] memory result = new Group[](groupIds.length);

        for (uint256 i = 0; i < groupIds.length; i++) {
            result[i] = groups[groupIds[i]];
        }

        return result;
    }

    /**
     * @dev Lấy tất cả nhóm công khai
     */
    function getAllPublicGroups() public view returns (Group[] memory) {
        uint256 publicGroupCount = 0;

        for (uint256 i = 1; i <= groupCounter; i++) {
            if (groups[i].exists && groups[i].groupType == GroupType.PUBLIC) {
                publicGroupCount++;
            }
        }

        Group[] memory result = new Group[](publicGroupCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= groupCounter; i++) {
            if (groups[i].exists && groups[i].groupType == GroupType.PUBLIC) {
                result[index] = groups[i];
                index++;
            }
        }

        return result;
    }

    /**
     * @dev Kiểm tra user có phải member không
     */
    function isMember(
        uint256 _groupId,
        address _user
    ) public view returns (bool) {
        return groupMembers[_groupId][_user];
    }

    /**
     * @dev Lấy số lượng nhóm
     */
    function getGroupCount() public view returns (uint256) {
        return groupCounter;
    }
}
