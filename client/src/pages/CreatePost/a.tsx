import React, { useState } from 'react';
import { BrowserProvider } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const LikeButton: React.FC = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  // Đăng nhập bằng MetaMask
  const handleLogin = async () => {
    console.log('🔐 Bắt đầu đăng nhập...');
    setAddress(null); // Xóa dữ liệu cũ
    setSignature(null);

    try {
      if (!window.ethereum) {
        console.error('❌ MetaMask chưa được cài');
        alert('Vui lòng cài đặt MetaMask!');
        return;
      }

      // Yêu cầu MetaMask mở ví mỗi lần
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        console.error('❌ Không có tài khoản nào được chọn');
        alert('Không thể đăng nhập. Vui lòng chọn tài khoản trong MetaMask!');
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      console.log('✅ Đã kết nối ví:', userAddress);

      // Gọi API lấy nonce
      const nonceRes = await fetch(`http://localhost:5000/api/auth/get-nonce?address=${userAddress}`);
      const nonceData = await nonceRes.json();
      const nonce = nonceData.nonce;
      console.log('📥 Nonce nhận được:', nonce);

      if (!nonce) {
        console.error('❌ Không nhận được nonce từ server');
        alert('Không nhận được nonce từ server');
        return;
      }

      const message = `Xác thực hành động Like với nonce: ${nonce}`;
      console.log('✍️ Đang ký message:', message);

      let userSignature: string;
      try {
        userSignature = await signer.signMessage(message);
        console.log('🖋️ Chữ ký:', userSignature);
      } catch (signErr: any) {
        console.error('❌ Lỗi khi ký message:', signErr);
        alert('Không thể ký xác thực. Vui lòng thử lại!');
        return;
      }

      setAddress(userAddress);
      setSignature(userSignature);
      alert('✅ Đăng nhập thành công!');
    } catch (err: any) {
      console.error('🔥 Lỗi đăng nhập:', err);
      alert('Đăng nhập thất bại!');
    }
  };

  // Gửi Like
  const handleLike = async () => {
    console.log('👍 Bắt đầu xử lý Like...');
    try {
      if (!address || !signature) {
        console.warn('⚠️ Chưa đăng nhập hoặc thiếu dữ liệu');
        alert('Vui lòng đăng nhập trước khi Like!');
        return;
      }

      const verifyRes = await fetch('http://localhost:5000/api/auth/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      });

      const result = await verifyRes.json();
      console.log('📬 Kết quả xác thực:', result);

      if (result.success) {
        alert('✅ Like thành công!');
      } else {
        console.error('❌ Xác thực thất bại:', result.error);
        alert('❌ Xác thực thất bại!');
      }
    } catch (err: any) {
      console.error('🔥 Lỗi khi gửi Like:', err);
      alert('Đã xảy ra lỗi khi Like!');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <button onClick={handleLogin} style={{ marginRight: '1rem', padding: '10px 20px' }}>
        🔐 Login
      </button>
      <button onClick={handleLike} style={{ padding: '10px 20px' }}>
        👍 Like
      </button>
    </div>
  );
};

export default LikeButton;
