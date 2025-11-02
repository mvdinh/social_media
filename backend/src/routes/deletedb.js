import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * DELETE /admin/clear-db
 * Xóa toàn bộ database (chỉ nên dùng cho DEV)
 */
router.delete('/clear-db', async (req, res) => {
  try {
    // Kiểm tra môi trường hoặc token bảo mật
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: '⚠️ Not allowed in production!' });
    }

    await mongoose.connection.dropDatabase();

    res.json({ message: '✅ Database cleared successfully!' });
  } catch (err) {
    console.error('❌ Error clearing DB:', err);
    res.status(500).json({ message: 'Failed to clear database', error: err.message });
  }
});

router.delete('/clear-data', async (req, res) => {
  try {
    // Kiểm tra môi trường hoặc token bảo mật
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: '⚠️ Not allowed in production!' });
    }

    const collections = Object.keys(mongoose.connection.collections);

    for (const collectionName of collections) {
      const collection = mongoose.connection.collections[collectionName];
      await collection.deleteMany({}); // Xóa tất cả documents
    }

    res.json({ message: '✅ All data cleared successfully (collections remain)!' });
  } catch (err) {
    console.error('❌ Error clearing DB:', err);
    res.status(500).json({ message: 'Failed to clear database', error: err.message });
  }
});


export default router;
