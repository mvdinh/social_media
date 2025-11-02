import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

// 🔹 Tạo key 32 bytes từ private key người dùng
const deriveKey = (privateKey) => {
  return crypto.createHash("sha256").update(privateKey).digest();
};

/**
 * 🧩 Mã hóa dữ liệu (string hoặc object)
 * @param {any} data - Dữ liệu cần mã hóa (string/object)
 * @param {string} privateKey - Private key của người dùng
 * @returns {string} Base64 (IV + encryptedData)
 */
export const encryptData = (data, privateKey) => {
  try {
    if (!privateKey) throw new Error("Missing private key for encryption");

    const key = deriveKey(privateKey);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const jsonData =
      typeof data === "string" ? data : JSON.stringify(data);

    let encrypted = cipher.update(jsonData, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Gộp IV + dữ liệu mã hóa
    const combined = Buffer.concat([iv, Buffer.from(encrypted, "base64")]);
    return combined.toString("base64");
  } catch (err) {
    console.error("❌ Encryption error:", err.message);
    throw err;
  }
};

/**
 * 🧩 Giải mã dữ liệu
 * @param {string} encryptedBase64 - Dữ liệu mã hóa dạng Base64
 * @param {string} privateKey - Private key của người dùng
 * @returns {any} Dữ liệu gốc (string hoặc object)
 */
export const decryptData = (encryptedBase64, privateKey) => {
  try {
    if (!privateKey) throw new Error("Missing private key for decryption");

    const encrypted = Buffer.from(encryptedBase64, "base64");
    const iv = encrypted.subarray(0, 16);
    const encryptedText = encrypted.subarray(16);
    const key = deriveKey(privateKey);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, "binary", "utf8");
    decrypted += decipher.final("utf8");

    // Nếu là JSON thì parse lại
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    console.error("❌ Decryption error:", err.message);
    return null;
  }
};
