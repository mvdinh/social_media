import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Search, Loader2, Users, X, UserPlus, Check, UserCheck } from "lucide-react";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  contracts: any;
  currentUserAddress: string;
}

const InviteMemberModal = ({ isOpen, onClose, groupId, contracts, currentUserAddress }: InviteMemberModalProps) => {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [invitingAddress, setInvitingAddress] = useState<string | null>(null);
  const [invitedSessionList, setInvitedSessionList] = useState<Set<string>>(new Set());

  const relationshipContract = contracts?.["relationship"];
  const accContract = contracts?.["account"];
  const groupContract = contracts?.["group"];

  // Dùng useCallback để ổn định hàm, tránh re-create
  const loadFriendsAndStatus = useCallback(async () => {
    if (!isOpen || !relationshipContract || !currentUserAddress || !groupContract) return;
    
    try {
      setLoading(true);
      
      // 1. Lấy list bạn bè (đây là mảng các địa chỉ ví string[])
      const list = await relationshipContract.getAllFriends(currentUserAddress);
      
      if (!list || list.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
      }

      // 2. Tối ưu hóa việc gọi contract:
      // Thay vì gọi từng cái một, ta chuẩn bị dữ liệu rồi Promise.all
      // Lưu ý: Nếu list quá dài (>20), nên chia batch để tránh tắc nghẽn RPC
      
      const formattedFriends = await Promise.all(
        list.map(async (addr: string) => {
          let username = `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
          let avatarHash = "";
          let bio = "";
          let isAlreadyMember = false;

          try {
            // Check Member trước (quan trọng nhất)
            isAlreadyMember = await groupContract.isMember(groupId, addr);

            // Lấy profile (có thể fail cũng không sao)
            if (accContract) {
               const isRegistered = await accContract.isUserRegistered(addr);
               if (isRegistered) {
                 const profile = await accContract.getProfile(addr);
                 username = profile.username || username;
                 avatarHash = profile.avatarHash || "";
                 bio = profile.bio || "";
               }
            }
          } catch (e) {
            console.warn("Error fetching friend detail:", addr);
          }

          return {
            address: addr,
            name: username,
            avatarHash,
            bio,
            isAlreadyMember, 
          };
        })
      );

      setFriends(formattedFriends);
    } catch (e) {
      console.error("Error loadFriends:", e);
      toast.error("Lỗi tải danh sách bạn bè");
    } finally {
      setLoading(false);
    }
  }, [isOpen, groupId, currentUserAddress, relationshipContract, groupContract, accContract]);

  // Chỉ gọi load khi isOpen chuyển thành true
  useEffect(() => {
    if (isOpen) {
      setSearchText("");
      loadFriendsAndStatus();
    }
  }, [isOpen, loadFriendsAndStatus]);

  const handleInvite = async (friendAddress: string) => {
    if (!groupContract) return;
    try {
      setInvitingAddress(friendAddress);
      console.log(`Inviting: ${friendAddress} to Group: ${groupId}`);
      
      const tx = await groupContract.inviteMember(groupId, friendAddress);
      toast.info("Đang gửi lời mời...");
      
      await tx.wait(); 
      
      toast.success("Đã gửi lời mời thành công!");
      setInvitedSessionList(prev => new Set(prev).add(friendAddress));

    } catch (e: any) {
      console.error("Invite error:", e);
      if (e.code === 4001) {
         toast.error("Đã hủy giao dịch");
      } else {
         toast.error("Lỗi mời thành viên: " + (e.reason || "Unknown error"));
      }
    } finally {
      setInvitingAddress(null);
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchText.toLowerCase()) ||
    f.address.toLowerCase().includes(searchText.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Mời thành viên</h2>
              <p className="text-xs text-gray-500">Mời bạn bè tham gia nhóm</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tìm kiếm..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 h-full">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-gray-500">Đang tải...</p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
                {friends.length === 0 ? "Bạn chưa có bạn bè nào để mời." : "Không tìm thấy kết quả."}
            </div>
          ) : (
            filteredFriends.map((friend) => {
              const isInvited = invitedSessionList.has(friend.address);
              const processing = invitingAddress === friend.address;
              const disabled = processing || isInvited || friend.isAlreadyMember;

              return (
                <div key={friend.address} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                       {friend.avatarHash ? (
                          <img src={`https://ipfs.io/ipfs/${friend.avatarHash}`} className="w-full h-full object-cover" />
                       ) : (
                          <span className="text-blue-600 font-bold">{friend.name.charAt(0).toUpperCase()}</span>
                       )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{friend.name}</p>
                      <p className="text-xs text-gray-500 truncate">{friend.bio || shortenAddress(friend.address)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleInvite(friend.address)}
                    disabled={disabled}
                    className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 transition-colors
                      ${friend.isAlreadyMember 
                        ? "bg-green-100 text-green-700 cursor-default" 
                        : isInvited 
                          ? "bg-gray-100 text-gray-500 cursor-default" 
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95"
                      }`}
                  >
                    {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                     friend.isAlreadyMember ? <><UserCheck className="w-3 h-3" /> Đã tham gia</> :
                     isInvited ? <><Check className="w-3 h-3" /> Đã mời</> :
                     <><UserPlus className="w-3 h-3" /> Mời</>
                    }
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Helper rút gọn địa chỉ cho đẹp
const shortenAddress = (addr: string) => `${addr.slice(0,6)}...${addr.slice(-4)}`;

export default InviteMemberModal;