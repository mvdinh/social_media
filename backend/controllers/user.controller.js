import User from "../models/user.js";
import { ethers } from "ethers";

export const getUserById = async (req, res) => {
  try {
    const {id} = req.params;
    
    // Tìm user theo _id hoặc address
    const user = await User.findOne({ 
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
  success: true,
  user:user
});

  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ error: error.message });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const {id} = req.params;

    // Lấy dữ liệu từ body
    const { 
      username, bio, dob, local, relationshipStatus, email,
      avatarCid, coverCid, metadataCid,
      signature, message
    } = req.body;

    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
      return res.status(403).json({ error: "Chữ ký không hợp lệ!" });
    }

    // --- 2. TÌM USER ---
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // --- 3. CẬP NHẬT CÓ ĐIỀU KIỆN (QUAN TRỌNG) ---

    // A. Các trường Text:
    // Kiểm tra !== undefined để cho phép Frontend gửi chuỗi rỗng "" (nếu muốn xóa bio/local)
    // Nếu Frontend KHÔNG gửi trường đó lên (undefined), giá trị cũ trong DB sẽ giữ nguyên.
    if (username !== undefined) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (local !== undefined) user.hometown = local;
    if (relationshipStatus !== undefined) user.relationshipStatus = relationshipStatus;
    if (email !== undefined) user.email = email;
    if (dob !== undefined) user.dob = new Date(dob);
    
    // B. Các trường Ảnh (CID) - Logic chặt chẽ hơn:
    // Chỉ cập nhật nếu có giá trị VÀ không phải chuỗi rỗng.
    // Điều này ngăn chặn việc Frontend gửi avatarCid="" làm mất ảnh cũ.
    if (avatarCid && avatarCid.trim().length > 0) {
        user.avatarIpfsHash = avatarCid;
    }

    if (coverCid && coverCid.trim().length > 0) {
        user.coverImageIpfsHash = coverCid;
    }

    if (metadataCid && metadataCid.trim().length > 0) {
        user.metadataCid = metadataCid;
    }

    // --- 4. LƯU VÀO DB ---
    await user.save();

    res.json({ 
      success: true, 
      message: "Cập nhật thành công!",
      user: {
        _id: user._id,
        username: user.username,
        bio: user.bio,
        local: user.hometown,
        birthDate: user.dob,
        relationshipStatus: user.relationshipStatus,
        avatar: user.avatarIpfsHash,       // Trả về giá trị mới (hoặc cũ nếu ko đổi)
        coverPhotoUrl: user.coverImageIpfsHash // Trả về giá trị mới (hoặc cũ nếu ko đổi)
      }
    });

  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: error.message });
  }
};