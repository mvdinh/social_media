import express from 'express';
import { authenticateToken, authenticateAndLoadUser } from '../middleware/authMiddleware.js';
import { User, Post, Relationship } from '../models/index.js';

const router = express.Router();

// ===============================================
// 1. GET /api/user/profile - Lấy thông tin user hiện tại
// ===============================================
router.get('/profile', authenticateAndLoadUser, async (req, res) => {
  try {
    const user = req.userDoc;

    // Đếm số followers và following
    const [followerCount, followingCount, postCount] = await Promise.all([
      Relationship.countDocuments({ followedUserId: user._id }),
      Relationship.countDocuments({ followerUserId: user._id }),
      Post.countDocuments({ userId: user._id })
    ]);

    res.json({
      success: true,
      user: {
        id: user._id,
        address: user.address,
        username: user.username,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profilePic: user.profilePic,
        coverPic: user.coverPic,
        city: user.city,
        website: user.website,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        stats: {
          followers: followerCount,
          following: followingCount,
          posts: postCount
        }
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch profile' 
    });
  }
});

// ===============================================
// 2. PUT /api/user/profile - Cập nhật profile
// ===============================================
router.put('/profile', authenticateAndLoadUser, async (req, res) => {
  try {
    const user = req.userDoc;
    const { username, name, email, bio, profilePic, coverPic, city, website } = req.body;

    // Validate và cập nhật username nếu có
    if (username && username.trim() && username !== user.username) {
      const existingUser = await User.findOne({ 
        username: username.trim(),
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          error: 'Username already taken' 
        });
      }
      user.username = username.trim();
    }

    // Validate và cập nhật email nếu có
    if (email && email.trim() && email !== user.email) {
      const existingEmail = await User.findOne({ 
        email: email.trim(),
        _id: { $ne: user._id }
      });
      
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'Email already in use' 
        });
      }
      user.email = email.trim();
    }

    // Cập nhật các field khác
    if (name !== undefined) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (profilePic !== undefined) user.profilePic = profilePic.trim();
    if (coverPic !== undefined) user.coverPic = coverPic.trim();
    if (city !== undefined) user.city = city.trim();
    if (website !== undefined) user.website = website.trim();

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        address: user.address,
        username: user.username,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profilePic: user.profilePic,
        coverPic: user.coverPic,
        city: user.city,
        website: user.website
      }
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile' 
    });
  }
});

// ===============================================
// 3. GET /api/user/:username - Lấy thông tin user theo username
// ===============================================
router.get('/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.userId;

    const user = await User.findOne({ username }).select('-nonce -nonceExpiry');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Đếm stats
    const [followerCount, followingCount, postCount, isFollowing] = await Promise.all([
      Relationship.countDocuments({ followedUserId: user._id }),
      Relationship.countDocuments({ followerUserId: user._id }),
      Post.countDocuments({ userId: user._id }),
      Relationship.findOne({ 
        followerUserId: currentUserId, 
        followedUserId: user._id 
      })
    ]);

    res.json({
      success: true,
      user: {
        id: user._id,
        address: user.address,
        username: user.username,
        name: user.name,
        bio: user.bio,
        profilePic: user.profilePic,
        coverPic: user.coverPic,
        city: user.city,
        website: user.website,
        createdAt: user.createdAt,
        stats: {
          followers: followerCount,
          following: followingCount,
          posts: postCount
        },
        isFollowing: !!isFollowing,
        isOwnProfile: user._id.toString() === currentUserId
      }
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user' 
    });
  }
});

// ===============================================
// 4. GET /api/user/:userId/followers - Lấy danh sách followers
// ===============================================
router.get('/:userId/followers', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const followers = await Relationship.find({ followedUserId: userId })
      .populate('followerUserId', 'username name profilePic bio')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Relationship.countDocuments({ followedUserId: userId });

    res.json({
      success: true,
      followers: followers.map(f => f.followerUserId),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get followers error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch followers' 
    });
  }
});

// ===============================================
// 5. GET /api/user/:userId/following - Lấy danh sách following
// ===============================================
router.get('/:userId/following', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const following = await Relationship.find({ followerUserId: userId })
      .populate('followedUserId', 'username name profilePic bio')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Relationship.countDocuments({ followerUserId: userId });

    res.json({
      success: true,
      following: following.map(f => f.followedUserId),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get following error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch following' 
    });
  }
});

// ===============================================
// 6. POST /api/user/:userId/follow - Follow user
// ===============================================
router.post('/:userId/follow', authenticateToken, async (req, res) => {
  try {
    const { userId: followedUserId } = req.params;
    const followerUserId = req.user.userId;

    // Không thể follow chính mình
    if (followerUserId === followedUserId) {
      return res.status(400).json({ 
        success: false,
        error: 'You cannot follow yourself' 
      });
    }

    // Kiểm tra user tồn tại
    const userToFollow = await User.findById(followedUserId);
    if (!userToFollow) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Kiểm tra đã follow chưa
    const existingFollow = await Relationship.findOne({
      followerUserId,
      followedUserId
    });

    if (existingFollow) {
      return res.status(400).json({ 
        success: false,
        error: 'Already following this user' 
      });
    }

    // Tạo relationship mới
    await Relationship.create({
      followerUserId,
      followedUserId
    });

    res.json({
      success: true,
      message: 'Successfully followed user'
    });
  } catch (error) {
    console.error('❌ Follow error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to follow user' 
    });
  }
});

// ===============================================
// 7. DELETE /api/user/:userId/unfollow - Unfollow user
// ===============================================
router.delete('/:userId/unfollow', authenticateToken, async (req, res) => {
  try {
    const { userId: followedUserId } = req.params;
    const followerUserId = req.user.userId;

    const result = await Relationship.deleteOne({
      followerUserId,
      followedUserId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Not following this user' 
      });
    }

    res.json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('❌ Unfollow error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to unfollow user' 
    });
  }
});

// ===============================================
// 8. GET /api/users - Lấy danh sách tất cả users (pagination + search)
// ===============================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    // Build search query
    const searchQuery = search ? {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(searchQuery)
      .select('username name profilePic bio createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(searchQuery);

    res.json({
      success: true,
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch users' 
    });
  }
});

// ===============================================
// 9. GET /api/user/search/suggestions - Gợi ý user để follow
// ===============================================
router.get('/search/suggestions', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { limit = 10 } = req.query;

    // Lấy danh sách user đã follow
    const following = await Relationship.find({ 
      followerUserId: currentUserId 
    }).distinct('followedUserId');

    // Tìm users chưa follow (trừ chính mình)
    const suggestions = await User.find({
      _id: { 
        $nin: [...following, currentUserId]
      },
      isActive: true
    })
      .select('username name profilePic bio')
      .limit(parseInt(limit))
      .sort({ loginCount: -1 }); // Sắp xếp theo active users

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('❌ Get suggestions error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch suggestions' 
    });
  }
});

export default router;