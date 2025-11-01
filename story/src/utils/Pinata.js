import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";

const PINATA_API_KEY = "ee0ab07677049d11295a";
const PINATA_SECRET = "f09107872299d248f3167f7a4d8d42a714649516b1715cc26315cbbe8dbdca7d";

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
