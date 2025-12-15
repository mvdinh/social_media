import { profileContract } from "./ProfileContract";

export async function getProfileCID(userAddress: string) {
  try {
    const has = await profileContract.hasProfile(userAddress);
    console.log(has);
    if (!has) {
      console.log("Người dùng này chưa có profile.");
      return null;
    }
    const profileHash = await profileContract.getProfileHash(userAddress);
    return profileHash;
  } catch (error) {
    console.error("Lỗi khi đọc profile hash:", error);
    return null;
  }
}

export async function fetchProfileDataFromIPFS(cid: string) {
  const ipfsGatewayUrl = `http://127.0.0.1:8080/ipfs/${cid}`;


  try {
    const response = await fetch(ipfsGatewayUrl);

    if (!response.ok) {
      throw new Error(
        `Không thể tải dữ liệu từ IPFS. Status: ${response.status}`
      );
    }
    const profileData = await response.json();

    console.log("Dữ liệu profile đã tải về:", profileData);
    return profileData;
  } catch (error) {
    console.error("Lỗi khi truy xuất dữ liệu IPFS:", error);
    throw new Error("Dữ liệu profile không thể truy cập hoặc bị hỏng.");
  }
}