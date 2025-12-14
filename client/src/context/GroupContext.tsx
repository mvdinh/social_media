import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import { useAuth1 } from '../context/Context'; 
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';

// ✅ IMPORT TRỰC TIẾP FILE JSON
// Lưu ý: Đường dẫn phải chính xác tới file .json của bạn
import GroupArtifact from '../contracts/groupsContract.json';

interface GroupContextType {
  createGroup: (data: CreateGroupData) => Promise<string | null>;
  groupContract: ethers.Contract | null;
  isLoading: boolean;
}

interface CreateGroupData {
  name: string;
  description: string;
  privacy: 'PUBLIC' | 'PRIVATE';
  imageFile: File | null;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth1(); 
  
  const [groupContract, setGroupContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. KHỞI TẠO CONTRACT TỪ JSON IMPORT
  useEffect(() => {
    const initContract = async () => {
      if (isAuthenticated && window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          // ✅ Dùng Address và ABI từ file JSON đã import
          const contract = new ethers.Contract(
            GroupArtifact.address, // "0x5Fb..."
            GroupArtifact.abi,     // Array [...]
            signer
          );

          console.log("✅ Group Contract connected:", GroupArtifact.address);
          setGroupContract(contract);
        } catch (error) {
          console.error("❌ Init contract failed:", error);
          setGroupContract(null);
        }
      } else {
        setGroupContract(null);
      }
    };

    initContract();
  }, [isAuthenticated]);

  // 2. HÀM TẠO GROUP
  const createGroup = async ({ name, description, privacy, imageFile }: CreateGroupData): Promise<string | null> => {
    if (!groupContract) {
      toast.error("Vui lòng kết nối ví (Contract chưa load)!");
      return null;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("🚀 Đang khởi tạo nhóm...");

    try {
      // --- BƯỚC A: GỌI BLOCKCHAIN ---
      const tx = await groupContract.createGroup(); 
      
      toast.loading("⏳ Đang xác nhận trên Blockchain...", { id: loadingToast });
      const receipt = await tx.wait();

      // --- BƯỚC B: LẤY GROUP ID TỪ EVENT ---
      let groupId = null;
      
      for (const log of receipt.logs) {
        try {
            const parsedLog = groupContract.interface.parseLog(log);
            if (parsedLog && parsedLog.name === 'GroupCreated') {
                groupId = parsedLog.args[0].toString();
                break;
            }
        } catch (e) { continue; }
      }

      if (!groupId) throw new Error("Không tìm thấy Group ID");
      console.log("✅ On-chain Group ID:", groupId);

      // --- BƯỚC C: GỌI API BACKEND ---
      toast.loading("💾 Đang đồng bộ dữ liệu...", { id: loadingToast });
      
      await new Promise(r => setTimeout(r, 2000));

      const formData = new FormData();
      formData.append('groupId', groupId);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('privacy', privacy);
      if (imageFile) {
        formData.append('avatar', imageFile);
      }

      await axiosClient.post('/groups', formData);

      toast.success("🎉 Tạo nhóm thành công!", { id: loadingToast });
      return groupId;

    } catch (error: any) {
      console.error(error);
      let msg = error.message || "Tạo nhóm thất bại";
      if (error.code === 'ACTION_REJECTED') msg = "Bạn đã từ chối giao dịch";
      toast.error(msg, { id: loadingToast });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GroupContext.Provider value={{ createGroup, groupContract, isLoading }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error("useGroup must be used within GroupProvider");
  return context;
};