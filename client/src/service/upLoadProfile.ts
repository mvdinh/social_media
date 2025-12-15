import { create } from "ipfs-http-client";
import { Buffer } from "buffer";
import type { IProfileData } from "../pages/Profile";

const IPFS_NODE_URL: string = "http://localhost:5001";

const ipfs = create({ url: IPFS_NODE_URL });

// interface UserProfileData {
//   name: string;
//   bio: string;
//   avatarUrl: string;
//   [key: string]: any;
// }

export async function uploadProfileToIPFS(
  profileData: IProfileData
): Promise<string> {
  try {
    const jsonString: string = JSON.stringify(profileData);
    const buffer: Buffer = Buffer.from(jsonString);
    console.log(
      `Đang tải dữ liệu lên IPFS Node Cục bộ tại: ${IPFS_NODE_URL}...`
    );

    try {
      await ipfs.version();
    } catch (error) {
      console.error("Lỗi kết nối IPFS Node Cục bộ:", error);
      throw new Error(
        `Không thể kết nối tới IPFS Node tại ${IPFS_NODE_URL}. Vui lòng kiểm tra "ipfs daemon".`
      );
    }

    const result = await ipfs.add(buffer);

    const profileHash: string = result.cid.toString();

    console.log(
      `Dữ liệu Profile đã được tải lên IPFS Cục bộ. CID: ${profileHash}`
    );

    return profileHash;
  } catch (error) {
    console.error("Lỗi khi tải lên IPFS Node Cục bộ:", error);
    throw new Error(`Tải dữ liệu thất bại. Chi tiết}`);
  }
}

export default uploadProfileToIPFS;