import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";

const PINATA_API_KEY = "ef6b1f8bcd4b17359978";
const PINATA_SECRET = "74b088b402921ea8e23a904d0f121b2d0d6f9181cf4dad4091565dc880e4d8c8";

export async function uploadToIPFS(filePath,metadata) {
  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));

  if (metadata) {
    data.append("pinataMetadata", JSON.stringify(metadata));
  }

  const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
    maxBodyLength: Infinity,
    headers: {
      ...data.getHeaders(),
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET,
    },
  });

  return res.data.IpfsHash;
}
