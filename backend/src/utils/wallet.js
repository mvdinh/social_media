import { verify } from 'crypto'
import { ethers } from 'ethers'
const verifyPersonalSign = async (address, message, signature) => {
    try {
        const recovered = ethers.verifyMessage(message, signature);
        return recovered.toLowerCase() === address.toLowerCase();

    } catch (e) {
        return false;
    }
}

export default verifyPersonalSign;