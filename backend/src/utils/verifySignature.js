import { bufferToHex, ecrecover, fromRpcSig, hashPersonalMessage, pubToAddress } from "ethereumjs-util";

export const verifySignature = (address, signature, nonce) => {
  try {
    const msgBuffer = Buffer.from(nonce);
    const msgHash = hashPersonalMessage(msgBuffer);
    const { v, r, s } = fromRpcSig(signature);
    const pubKey = ecrecover(msgHash, v, r, s);
    const addrBuf = pubToAddress(pubKey);
    const recoveredAddress = bufferToHex(addrBuf);

    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (err) {
    console.error("verifySignature error:", err);
    return false;
  }
};
