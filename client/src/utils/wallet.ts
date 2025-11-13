import { ethers } from "ethers";
import FriendSystemConf from "../config/friendSystem.json";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) throw new Error("Vui lòng cài Metamask!");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts[0];
}

export async function getContract(signer?: ethers.Signer) {
  if (!window.ethereum) throw new Error("Không tìm thấy ví");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signerUsed = signer || (await provider.getSigner());

  return new ethers.Contract(
    FriendSystemConf.address,
    FriendSystemConf.abi,
    signerUsed
  );
}
