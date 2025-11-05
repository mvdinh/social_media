import { getOrCreateMessagingKeypair } from './crypto';
import { Users, setUserAddressHeader } from '../services/api';

export async function ensureMessagingKeySynced(myAddress: string) {
    //  Set header để backend biết user đang thao tác
    setUserAddressHeader(myAddress);

    //  Tạo keypair local nếu chưa có (lưu privateKey trong localStorage)
    const kp = getOrCreateMessagingKeypair();

    //  Gửi publicKey lên server
    await Users.updateMe(kp.publicKey);
}
