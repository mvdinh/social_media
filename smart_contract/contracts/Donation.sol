// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Simple Donation Contract
/// @notice Người dùng có thể tạo "post donate" rồi những người khác donate vào post đó.
/// Số tiền sẽ được giữ trong hợp đồng và creator của post có thể rút về sau.
contract Donation {
    // --- Reentrancy guard ---
    uint256 private unlocked = 1;
    modifier nonReentrant() {
        require(unlocked == 1, "Reentrant call");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    // --- Data structures ---
    struct Post {
        address creator;
        string metadata; // ví dụ: tiêu đề / mô tả / ipfs hash
        uint256 balance; // số wei hiện đang giữ cho post
        uint256 totalDonations; // tổng đã donate (tăng dần)
        uint256 createdAt;
        bool exists;
        bool archived; // ✅ Trạng thái lưu trữ
    }

    struct DonationEntry {
        address donor;
        uint256 amount;
        uint256 timestamp;
    }

    // postId tăng dần
    uint256 private _nextPostId = 1;
    mapping(uint256 => Post) public posts;
    // Lưu danh sách donations cho mỗi post
    mapping(uint256 => DonationEntry[]) private _donationsByPost;

    // --- Events ---
    event PostCreated(
        uint256 indexed postId,
        address indexed creator,
        string metadata
    );
    event Donated(
        uint256 indexed postId,
        address indexed donor,
        uint256 amount
    );
    event Withdrawn(uint256 indexed postId, address indexed to, uint256 amount);
    event PostArchived(uint256 indexed postId, address indexed creator);
    event PostUnarchived(uint256 indexed postId, address indexed creator);

    // --- Create a donation post ---
    /// @notice Tạo 1 post để người khác donate vào
    /// @param metadata Một chuỗi mô tả (có thể là ipfs hash, title, ...)
    /// @return postId id của post vừa tạo
    function createPost(
        string calldata metadata
    ) external returns (uint256 postId) {
        postId = _nextPostId++;
        posts[postId] = Post({
            creator: msg.sender,
            metadata: metadata,
            balance: 0,
            totalDonations: 0,
            createdAt: block.timestamp,
            exists: true,
            archived: false
        });

        emit PostCreated(postId, msg.sender, metadata);
    }

    // --- Donate to a post ---
    /// @notice Donate vào post bằng cách gửi ETH cùng với call
    /// @param postId id của post muốn donate
    function donate(uint256 postId) external payable {
        require(postId > 0 && posts[postId].exists, "Post not found");
        require(!posts[postId].archived, "Post is archived");
        require(msg.value > 0, "Donate amount must be > 0");

        // cập nhật trạng thái post
        posts[postId].balance += msg.value;
        posts[postId].totalDonations += msg.value;

        // lưu lịch sử donate với địa chỉ ví
        _donationsByPost[postId].push(
            DonationEntry({
                donor: msg.sender,
                amount: msg.value,
                timestamp: block.timestamp
            })
        );

        emit Donated(postId, msg.sender, msg.value);
    }

    // --- Archive/Unarchive post (only creator) ---
    /// @notice Creator lưu trữ chiến dịch
    /// @param postId id của post
    function archivePost(uint256 postId) external {
        require(postId > 0 && posts[postId].exists, "Post not found");
        require(
            msg.sender == posts[postId].creator,
            "Only creator can archive"
        );
        require(!posts[postId].archived, "Post already archived");

        posts[postId].archived = true;
        emit PostArchived(postId, msg.sender);
    }

    /// @notice Creator khôi phục chiến dịch từ lưu trữ
    /// @param postId id của post
    function unarchivePost(uint256 postId) external {
        require(postId > 0 && posts[postId].exists, "Post not found");
        require(
            msg.sender == posts[postId].creator,
            "Only creator can unarchive"
        );
        require(posts[postId].archived, "Post is not archived");

        posts[postId].archived = false;
        emit PostUnarchived(postId, msg.sender);
    }

    // --- Withdraw (only post creator) ---
    /// @notice Creator của post rút số dư của post
    /// @param postId id của post
    function withdraw(uint256 postId) external nonReentrant {
        require(postId > 0 && posts[postId].exists, "Post not found");
        Post storage p = posts[postId];
        require(msg.sender == p.creator, "Only creator can withdraw");
        uint256 amount = p.balance;
        require(amount > 0, "No balance to withdraw");

        // đặt balance trước để tránh reentrancy
        p.balance = 0;

        // transfer (sử dụng call để tránh giới hạn gas)
        (bool ok, ) = p.creator.call{value: amount}("");
        require(ok, "Transfer failed");

        emit Withdrawn(postId, p.creator, amount);
    }

    // --- View helpers ---
    /// @notice Lấy tổng số donation (tổng đã donate) cho post
    function getPostTotal(uint256 postId) external view returns (uint256) {
        require(postId > 0 && posts[postId].exists, "Post not found");
        return posts[postId].totalDonations;
    }

    /// @notice Lấy số dư hiện tại (chưa rút) của post
    function getPostBalance(uint256 postId) external view returns (uint256) {
        require(postId > 0 && posts[postId].exists, "Post not found");
        return posts[postId].balance;
    }

    /// @notice Lấy số lượng donation entry cho post
    function getDonationsCount(uint256 postId) external view returns (uint256) {
        require(postId > 0 && posts[postId].exists, "Post not found");
        return _donationsByPost[postId].length;
    }

    /// @notice Lấy donation entry theo index (0..count-1)
    function getDonationEntry(
        uint256 postId,
        uint256 index
    ) external view returns (address donor, uint256 amount, uint256 timestamp) {
        require(postId > 0 && posts[postId].exists, "Post not found");
        require(index < _donationsByPost[postId].length, "Index out of bounds");
        DonationEntry storage d = _donationsByPost[postId][index];
        return (d.donor, d.amount, d.timestamp);
    }

    /// @notice Lấy tất cả donations của một post (dùng cho view - tốn gas nếu gọi từ transaction)
    function getAllDonations(
        uint256 postId
    ) external view returns (DonationEntry[] memory) {
        require(postId > 0 && posts[postId].exists, "Post not found");
        return _donationsByPost[postId];
    }

    // Fallback/receive để tránh gửi ETH nhầm (nếu muốn)
    receive() external payable {
        revert("Send via donate(postId)");
    }

    function getTotalPosts() external view returns (uint256) {
        return _nextPostId - 1;
    }
}
