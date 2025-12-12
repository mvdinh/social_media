const router = require('express').Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 1. Cấu hình Multer (Lưu file tạm)
const upload = multer({ dest: 'uploads/' });

// Cấu hình địa chỉ IPFS Desktop Local
const IPFS_API_URL = 'http://127.0.0.1:5001/api/v0/add'; // Cổng API để ghi
const IPFS_GATEWAY_URL = 'http://127.0.0.1:8080/ipfs';   // Cổng Gateway để đọc


router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Chưa chọn file" });

        // Đọc file tạm từ ổ cứng
        const fileStream = fs.createReadStream(req.file.path);

        // Chuẩn bị form-data gửi sang IPFS
        const formData = new FormData();
        formData.append('file', fileStream);

        // Gọi API của IPFS Desktop
        const response = await axios.post(IPFS_API_URL, formData, {
            headers: { ...formData.getHeaders() },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Xóa file tạm cho sạch server
        fs.unlinkSync(req.file.path);

        // Lấy Hash (CID)
        const ipfsHash = response.data.Hash;
        console.log(`✅ Uploaded: ${ipfsHash}`);

        res.json({
            success: true,
            hash: ipfsHash,
            // Trả về URL của chính Backend mình để Client hiển thị
            url: `http://localhost:3000/api/ipfs/view/${ipfsHash}`
        });

    } catch (error) {
        console.error("❌ Upload Error:", error.message);
        // Xóa file tạm nếu lỗi
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        if (error.code === 'ECONNREFUSED') {
            return res.status(500).json({ error: "Lỗi: Hãy bật phần mềm IPFS Desktop lên!" });
        }
        res.status(500).json({ error: "Upload thất bại" });
    }
});

// ==========================================
// API 2: VIEW FILE (Client -> Node.js -> IPFS)
// Đây là hàm Proxy giúp hiển thị ảnh
// ==========================================
router.get('/view/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const ipfsUrl = `${IPFS_GATEWAY_URL}/${cid}`;

        // Gọi sang IPFS Gateway lấy dữ liệu (dạng stream)
        const response = await axios.get(ipfsUrl, {
            responseType: 'stream' // Quan trọng: Nhận dữ liệu dạng luồng
        });

        // Set Header để trình duyệt hiểu đây là ảnh/video
        res.setHeader('Content-Type', response.headers['content-type']);
        
        // Bơm (Pipe) dữ liệu từ IPFS thẳng về Client
        response.data.pipe(res);

    } catch (error) {
        console.error("❌ View Error:", error.message);
        res.status(404).send("File not found on IPFS");
    }
});

module.exports = router;