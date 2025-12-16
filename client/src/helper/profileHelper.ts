import { ethers } from "ethers";
import { uploadTextToIpfs } from "../services/ipfs.service";

export const saveProfileToBlockchain = async (
  profileData: any,
  contractInstance: any // Truyền contract instance từ component
) => {
  try {
    if (!window.ethereum) throw new Error("Vui lòng cài đặt MetaMask");

    // 1. Upload toàn bộ data lên IPFS dưới dạng Text
    console.log("1️⃣ Đang upload metadata lên IPFS...");
    const cid = await uploadTextToIpfs(profileData);
    console.log("✅ IPFS CID:", cid);

    // 2. Lấy Signer từ Metamask để ký transaction
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // 3. Connect contract với Signer
    const profileContract = contractInstance.connect(signer);

    // 4. Gọi hàm Smart Contract
    console.log("2️⃣ Đang ghi CID vào Blockchain...");
    const tx = await profileContract.createOrUpdateProfile(cid);
    
    console.log("⏳ Đang đợi xác nhận giao dịch:", tx.hash);
    await tx.wait();

    console.log("✅ Lưu thành công lên Blockchain!");
    
    return cid;

  } catch (error: any) {
    console.error("❌ Lỗi Blockchain:", error);
    if (error.code === 4001) throw new Error("Bạn đã từ chối giao dịch.");
    throw error;
  }
};