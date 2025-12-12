import Reaction from "../models/reaction.js";

/**
 * POST /api/story/react
 * Tạo reaction mới (Yêu cầu có Token)
 */
export const createReaction = async (req, res) => {
  try {
    // 1. LẤY ĐỊA CHỈ TỪ JWT
    // Middleware verifyToken đã giải mã token và gán payload vào req.user
    const reactorAddress = req.user?.address; 
    
    if (!reactorAddress) {
        return res.status(401).json({ error: "Unauthorized: Invalid Token" });
    }

    const { storyHash, reactionType } = req.body;

    // Validate input
    if (!storyHash || !reactionType) {
        return res.status(400).json({ error: "Missing storyHash or reactionType" });
    }

    // 2. CHECK TRÙNG LẶP
    // Kiểm tra xem user này đã thả biểu cảm NÀY cho story NÀY chưa
    const existingReaction = await Reaction.findOne({
      storyHash,
      reactorAddress,
      reactionType
    });

    if (existingReaction) {
      // Nếu muốn làm tính năng "Bỏ tim" (Toggle), bạn có thể xóa record này ở đây.
      // Hiện tại ta trả về lỗi để báo cho Frontend biết.
      return res.status(400).json({ error: "Bạn đã thả biểu cảm này rồi!" });
    }

    // 3. LƯU VÀO DB
    await Reaction.create({
      storyHash,
      reactorAddress, // Address lấy từ Token -> An toàn
      reactionType,
      timestamp: new Date()
    });

    // 4. ĐẾM LẠI SỐ LƯỢNG (Để trả về cho Frontend update UI ngay)
    const count = await Reaction.countDocuments({ storyHash, reactionType });

    res.json({ 
        success: true, 
        message: "Reaction added",
        currentCount: count,
        reactionType 
    });

  } catch (err) {
    console.error("Reaction Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * GET /api/story/reactions/:storyHash
 * Lấy tổng số lượng các loại reaction của 1 story
 */
export const getReactions = async (req, res) => {
  try {
    const { storyHash } = req.params;

    // Aggregate để gom nhóm theo loại (👍, ❤️, ...)
    const counts = await Reaction.aggregate([
      { $match: { storyHash: storyHash } },
      { $group: { _id: "$reactionType", count: { $sum: 1 } } }
    ]);
    
    // Chuyển mảng thành object: { "👍": 5, "❤️": 2 }
    const result = counts.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});
    
    res.json(result);
  } catch (err) {
    console.error("Get Reactions Error:", err);
    res.status(500).json({ error: "Failed to fetch counts" });
  }
};