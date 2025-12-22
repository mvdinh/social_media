🌐 Decentralized Social Media (DeSoc) - Web3 Platform
Một nền tảng mạng xã hội phi tập trung thế hệ mới, kết hợp sức mạnh của Blockchain (Ethereum), Lưu trữ phi tập trung (IPFS) và Cơ sở dữ liệu truyền thống (MongoDB) để tối ưu hóa hiệu năng và chi phí.

🚀 Tính năng chính
Quyền sở hữu nội dung: Bài đăng (Post) nội dung văn bản và hình ảnh/video được lưu trữ an toàn trên IPFS, đảm bảo tính toàn vẹn dữ liệu.

Danh tính số (DID): Đăng nhập bảo mật thông qua ví Crypto (MetaMask, WalletConnect). Không cần email, không cần mật khẩu.

Story: Chia sẻ khoảnh khắc ngắn hạn một cách nhanh chóng.

Tương tác Hybird (Off-chain): Các tính năng Like, Comment được lưu trữ tại MongoDB để tối ưu tốc độ phản hồi và tiết kiệm phí gas cho người dùng.

Hệ thống Donate: Hỗ trợ gửi tặng Token trực tiếp cho người cần donate thông qua giao dịch on-chain.

Nhóm (Groups): Tạo cộng đồng và đăng bài vào nhóm bằng cách ký giao dịch Blockchain, đảm bảo quyền quản trị phi tập trung.

🛠 Công nghệ sử dụng
Backend & Blockchain
Smart Contracts: Solidity (Ngôn ngữ lập trình hợp đồng thông minh).

Blockchain: Ethereum (Phát triển trên môi trường Hardhat).

Server: Node.js (Xử lý logic nghiệp vụ và API).

Database: MongoDB (Lưu trữ dữ liệu tương tác off-chain như Like, Comment).

Storage: IPFS (Lưu trữ dữ liệu tệp tin phi tập trung).

Frontend
Framework: React.js & TypeScript.

Styling: Tailwind CSS.

Blockchain Interaction: Ethers.js (Kết nối Frontend với Smart Contract).

📋 Yêu cầu hệ thống
Để chạy dự án này, bạn cần cài đặt:

Node.js: v16.x trở lên.

IPFS Local: Cài đặt và chạy IPFS Desktop hoặc IPFS Kubo.

MetaMask: Tiện ích mở rộng trên trình duyệt.

MongoDB: Local instance hoặc MongoDB Atlas.

🔧 Cài đặt và Chạy thử
1. Clone dự án
Bash

git clone https://github.com/your-username/social_media.git
cd social_media
2. Cấu hình Smart Contracts
Bash

cd smart_contract
npm install
npx hardhat compile
Deploy lên mạng local/testnet:

Bash

npm run deployAll
Lưu ý: Lưu lại Address của contract sau khi deploy để dán vào cấu hình Frontend.

3. Khởi chạy Backend
Bash

cd ../backend
npm install
# Tạo file .env và cấu hình MONGODB_URI
npm start
4. Khởi chạy Frontend
Bash

cd ../frontend
npm install
npm run dev
Truy cập: http://localhost:3000

🏗 Kiến trúc hệ thống
Xác thực: Người dùng kết nối ví MetaMask để thiết lập phiên làm việc.

Đăng bài: * Ảnh/Video được đẩy lên IPFS, nhận về mã băm CID.

Frontend gọi Smart Contract để lưu CID và thông tin bài viết lên Blockchain.

Tương tác: Like/Comment được gửi về Node.js Server và lưu tại MongoDB để hiển thị thời gian thực.

Hiển thị: Frontend tổng hợp dữ liệu từ Blockchain (nội dung gốc) và MongoDB (tương tác) để tạo ra giao diện hoàn chỉnh.
