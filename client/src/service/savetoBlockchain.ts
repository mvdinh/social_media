import { ethers } from "ethers";
import uploadProfileToIPFS from "./upLoadProfile";
import { profileContract } from "./ProfileContract";
import type { IProfileData } from "../pages/Profile";

async function saveProfileToBlockchain(profileData: IProfileData) {
  if (!window.ethereum) {
    throw new Error("Vui lòng cài đặt ví MetaMask hoặc ví tương thích.");
  }

  const profileHash = await uploadProfileToIPFS(profileData);

  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    await provider.send("eth_requestAccounts", []);

    console.log(`Đang gửi giao dịch lưu CID: ${profileHash} lên Contract...`);

    const tx = await profileContract.createOrUpdateProfile(profileHash);

    console.log("Transaction Hash:", tx.hash);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      console.log("🎉 Profile đã được lưu thành công trên blockchain!");
      return receipt;
    } else {
      throw new Error("Giao dịch thất bại (Status: 0).");
    }
  } catch (error) {
    console.error("Lỗi trong quá trình lưu Profile:", error);
    throw new Error(`Giao dịch lưu Profile thất bại. Chi tiết: ${error}`);
  }
}

export default saveProfileToBlockchain;