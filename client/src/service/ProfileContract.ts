import { ethers } from "ethers";
import contractAddresses from "../config/contract-addresses.json";
import ProfileContract from "../config/Profile.json";
const provider = new ethers.BrowserProvider((window as any).ethereum);
const signer = await provider.getSigner();
export const profileContract = new ethers.Contract(
  contractAddresses.Profile,
  ProfileContract.abi,
  signer
);