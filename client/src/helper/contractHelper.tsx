import React from 'react';
import { ethers } from 'ethers';
import contractAddress from './../config/contract-address.json';
import contractABI from './../config/SocialMedia.json';

export const contractHelper = async () => {
  try {
    // Kiểm tra MetaMask
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return null;
    }

    // Kết nối MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    const account = await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();

    // Kết nối smart contract
    const contract = new ethers.Contract(
      contractAddress.SocialMedia,
      contractABI.abi,
      signer
    );

    const user = account[0];
    // Trả về đối tượng contract và địa chỉ ví người dùng
    return { contract, user };

  } catch (error) {
    console.error(' Error connecting to contract:', error);
    alert('Failed to connect to MetaMask or contract. Check console for details.');
    return null;
  }
};
