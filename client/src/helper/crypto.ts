
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

const STORAGE_KEY = 'msg_kp_v1';

export type Keypair = { publicKey: string; secretKey: string };

export function getOrCreateMessagingKeypair(): Keypair {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const kp = nacl.box.keyPair();
    const data = { publicKey: encodeBase64(kp.publicKey), secretKey: encodeBase64(kp.secretKey) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
}

export function deriveSharedKey(mySecretB64: string, peerPublicB64: string) {
    const sk = decodeBase64(mySecretB64);
    const pk = decodeBase64(peerPublicB64);
    const shared = nacl.box.before(pk, sk); // 32 bytes
    return shared;
}

export function encryptPayload(sharedKey: Uint8Array, payload: any) {
    const nonce = nacl.randomBytes(24);
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    const ct = nacl.secretbox(bytes, nonce, sharedKey);
    return { nonce: encodeBase64(nonce), b64: Buffer.from(ct).toString('base64') };
}

export function decryptPayload(sharedKey: Uint8Array, nonceB64: string, b64: string) {
    const nonce = decodeBase64(nonceB64);
    const ct = Buffer.from(b64, 'base64');
    const opened = nacl.secretbox.open(new Uint8Array(ct), nonce, sharedKey);
    if (!opened) throw new Error('Decrypt failed');
    return JSON.parse(new TextDecoder().decode(opened));
}