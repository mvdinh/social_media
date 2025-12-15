import User from "../models/User.js";
import Relationship from "../models/Relationship.js";

// Helper chọn trường hiển thị khi populate
const userSelectFields = "username address avatar bio -_id";

// ===========================
// 1. GỬI LỜI MỜI KẾT BẠN
// ===========================
export const sendFriendRequest = async (req, res) => {
  try {
    const myAddress = req.user.address.toLowerCase();
    const { targetAddress } = req.body;
    const friendAddress = targetAddress.toLowerCase();

    if (myAddress === friendAddress) {
      return res.status(400).json({ message: "Không thể kết bạn với chính mình." });
    }

    // 1. Check User đích
    const targetUser = await User.findOne({ address: friendAddress });
    if (!targetUser) {
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    // 2. Check quan hệ cũ
    const existingRel = await Relationship.findOne({
      $or: [
        { requester: myAddress, recipient: friendAddress },
        { requester: friendAddress, recipient: myAddress }
      ]
    });

    if (existingRel) {
      if (existingRel.status === 'pending') return res.status(400).json({ message: "Đã có lời mời đang chờ xử lý." });
      if (existingRel.status === 'accepted') return res.status(400).json({ message: "Các bạn đã là bạn bè." });
      if (existingRel.status === 'blocked') return res.status(400).json({ message: "Không thể gửi lời mời." });
    }

    // 3. Tạo record mới
    const newRel = new Relationship({
      requester: myAddress,
      recipient: friendAddress,
      status: 'pending'
    });
    await newRel.save();

    // =========================================================
    // 🔥 REALTIME SOCKET NOTIFICATION
    // =========================================================
    try {
      // A. Lấy thông tin người gửi (chính mình) để hiển thị cho người kia
      const senderInfo = await User.findOne({ address: myAddress }).select(userSelectFields);

      // B. Tìm Socket ID của người nhận
      // (Giả sử bạn dùng Map: onlineUsers.set(address, socketId))
      const recipientSocketId = global.onlineUsers.get(friendAddress);

      if (recipientSocketId) {
        // C. Bắn sự kiện "new_friend_request"
        global.io.to(recipientSocketId).emit("new_friend_request", {
          _id: senderInfo._id,
          address: senderInfo.address,
          username: senderInfo.username,
          avatar: senderInfo.avatar,
          bio: senderInfo.bio,
          status: "PENDING_RECEIVED",
          mutualFriends: 0,
          requestId: newRel._id // Gửi kèm ID của relationship
        });
        
        console.log(`Socket sent to ${friendAddress} (ID: ${recipientSocketId})`);
      }
    } catch (socketError) {
      console.error("Socket emit error:", socketError);
      // Không throw error ở đây để tránh làm fail request HTTP
    }
    // =========================================================

    res.status(200).json({ message: "Đã gửi lời mời kết bạn!", data: newRel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===========================
// 2. CHẤP NHẬN LỜI MỜI
// ===========================
export const acceptFriendRequest = async (req, res) => {
  try {
    const myAddress = req.user.address.toLowerCase();
    const { targetAddress } = req.body;
    const senderAddress = targetAddress.toLowerCase();

    // Tìm lời mời: Người kia gửi (requester), Mình nhận (recipient)
    const relation = await Relationship.findOne({
      requester: senderAddress,
      recipient: myAddress,
      status: 'pending'
    });

    if (!relation) {
      return res.status(404).json({ message: "Không tìm thấy lời mời kết bạn này." });
    }

    relation.status = 'accepted';
    await relation.save();

    res.status(200).json({ message: "Đã chấp nhận kết bạn!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===========================
// 3. TỪ CHỐI / HỦY KẾT BẠN
// ===========================
export const removeRelationship = async (req, res) => {
  try {
    const myAddress = req.user.address.toLowerCase();
    const { targetAddress } = req.body;
    const otherAddress = targetAddress.toLowerCase();

    // Tìm quan hệ bất kể chiều nào
    const relation = await Relationship.findOne({
      $or: [
        { requester: myAddress, recipient: otherAddress },
        { requester: otherAddress, recipient: myAddress }
      ]
    });

    if (!relation) {
      return res.status(404).json({ message: "Không tìm thấy quan hệ." });
    }

    // Xóa theo ID của relationship tìm được
    await Relationship.findByIdAndDelete(relation._id);

    res.status(200).json({ message: "Đã xóa quan hệ." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===========================
// 4. LẤY DANH SÁCH BẠN BÈ
// ===========================
export const getFriends = async (req, res) => {
  try {
    const myAddress = req.user.address.toLowerCase();

    // Tìm tất cả record có chứa address của mình và status 'accepted'
    const relationships = await Relationship.find({
      $or: [{ requester: myAddress }, { recipient: myAddress }],
      status: 'accepted'
    })
    // Populate dựa trên Virtuals đã định nghĩa ở Model
    .populate('requesterInfo', userSelectFields)
    .populate('recipientInfo', userSelectFields);

    // Map dữ liệu: Lấy info của người "không phải là mình"
    const friends = relationships.map(rel => {
      if (rel.requester === myAddress) {
        return rel.recipientInfo; // Mình gửi -> lấy người nhận
      } else {
        return rel.requesterInfo; // Mình nhận -> lấy người gửi
      }
    });

    // Lọc những null (đề phòng trường hợp user bị xóa khỏi DB nhưng relationship còn sót)
    const validFriends = friends.filter(f => f !== null);

    res.status(200).json(validFriends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===========================
// 5. LẤY DANH SÁCH LỜI MỜI ĐÃ NHẬN
// ===========================
export const getPendingRequests = async (req, res) => {
  try {
    const myAddress = req.user.address.toLowerCase();

    // Tìm những record mình là recipient, status pending
    const requests = await Relationship.find({
      recipient: myAddress,
      status: 'pending'
    })
    .populate('requesterInfo', userSelectFields);

    const formatted = requests.map(req => {
      if (!req.requesterInfo) return null; // Skip nếu user đã bị xóa
      return {
        ...req.requesterInfo.toObject(),
        requestId: req._id,
        status: 'PENDING_RECEIVED'
      };
    }).filter(item => item !== null);

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===========================
// 6. GỢI Ý KẾT BẠN
// ===========================
export const getSuggestedUsers = async (req, res) => {
  try {
    const myAddress = req.user.address.toLowerCase();

    // 1. Lấy danh sách address những người ĐÃ có tương tác (pending hoặc accepted)
    const myRelationships = await Relationship.find({
      $or: [{ requester: myAddress }, { recipient: myAddress }]
    });

    const excludeAddresses = [myAddress]; // Luôn loại bỏ chính mình
    myRelationships.forEach(rel => {
      if (rel.requester !== myAddress) excludeAddresses.push(rel.requester);
      if (rel.recipient !== myAddress) excludeAddresses.push(rel.recipient);
    });

    // 2. Tìm trong bảng User những ai có address KHÔNG nằm trong list trên
    const suggestions = await User.find({
      address: { $nin: excludeAddresses }
    })
    .select(userSelectFields)
    .limit(20);

    const formatted = suggestions.map(user => ({
      ...user.toObject(),
      status: "NONE"
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};