import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, UserPlus, LogOut, Loader2, ShieldCheck } from "lucide-react";
import InviteMemberModal from "./InviteMemberModal";
import LeaveGroupModal from "./LeaveGroupModal";

interface ActionHeaderProps {
  groupId: string;
  contracts?: any;
  address?: string;
}

const ActionHeader = ({ groupId, contracts, address }: ActionHeaderProps) => {
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false); // Thêm state kiểm tra chủ nhóm
  const [checkingMember, setCheckingMember] = useState(true);
  const [leavingGroup, setLeavingGroup] = useState(false);

  const groupContract = contracts?.["group"];

  // Dùng useCallback để tránh hàm bị tạo lại liên tục gây loop
  const checkStatus = useCallback(async () => {
    if (!groupContract || !address || !groupId) return;
    
    try {
      setCheckingMember(true);
      
      // Gọi song song 2 promises để tiết kiệm thời gian
      const [memberStatus, groupInfo] = await Promise.all([
        groupContract.isMember(groupId, address),
        groupContract.getGroup(groupId)
      ]);

      setIsMember(memberStatus);
      
      // Kiểm tra xem address hiện tại có phải owner không
      // Lưu ý: Cần so sánh address chữ thường để tránh lỗi case-sensitive
      const ownerAddress = groupInfo.owner; 
      if (ownerAddress && address.toLowerCase() === ownerAddress.toLowerCase()) {
        setIsOwner(true);
        setIsMember(true); // Owner chắc chắn là member
      } else {
        setIsOwner(false);
      }

    } catch (e) {
      console.error("Error checking status:", e);
    } finally {
      setCheckingMember(false);
    }
  }, [groupContract, address, groupId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Xử lý Tham gia nhóm (nếu chưa tham gia)
  const handleJoinGroup = async () => {
    try {
      if (!groupContract) return;
      toast.info("Đang gửi yêu cầu tham gia...");
      const tx = await groupContract.requestJoinGroup(groupId);
      await tx.wait();
      toast.success("Đã gửi yêu cầu thành công!");
      checkStatus(); // Reload lại trạng thái
    } catch (e: any) {
      console.error(e);
      toast.error("Lỗi khi tham gia nhóm");
    }
  };

  const handleLeaveGroup = async () => {
    if (isOwner) {
      toast.error("Bạn là quản trị viên, không thể rời nhóm. Hãy chuyển quyền trước!");
      return;
    }

    try {
      setLeavingGroup(true);
      if (!groupContract) throw new Error("Contract not found");

      const tx = await groupContract.leaveGroup(groupId);
      toast.info("Đang xử lý yêu cầu rời nhóm...");
      await tx.wait();

      toast.success("Đã rời nhóm thành công");
      setIsMember(false);
      setShowLeavePopup(false);
    } catch (e: any) {
      console.error("Leave group error:", e);
      toast.error("Lỗi khi rời nhóm: " + (e.reason || e.message));
    } finally {
      setLeavingGroup(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Nút Mời */}
        {isMember && (
          <button
            onClick={() => setShowInvitePopup(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span className="font-medium">Mời</span>
          </button>
        )}

        {/* Nút Trạng thái */}
        {checkingMember ? (
          <div className="px-4 py-2 rounded-md bg-gray-100 flex items-center gap-2 text-gray-500">
             <Loader2 className="w-4 h-4 animate-spin" />
             <span className="text-sm">Kiểm tra...</span>
          </div>
        ) : isMember ? (
          <button 
            onClick={() => !isOwner && setShowLeavePopup(true)}
            className={`group relative border px-4 py-2 rounded-lg flex items-center gap-2 transition-all 
              ${isOwner 
                ? "bg-yellow-50 text-yellow-700 border-yellow-200 cursor-default" 
                : "bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600 border-green-200 hover:border-red-200"
              }`}
          >
            {isOwner ? (
               // Giao diện cho Owner
               <>
                 <ShieldCheck className="w-4 h-4" />
                 <span className="font-medium">Quản trị viên</span>
               </>
            ) : (
               // Giao diện cho Member thường
               <>
                 <div className="flex items-center gap-2 group-hover:hidden">
                   <Check className="w-4 h-4" />
                   <span className="font-medium">Đã tham gia</span>
                   <ChevronDown className="w-4 h-4 opacity-50" />
                 </div>
                 <div className="hidden group-hover:flex items-center gap-2">
                   <LogOut className="w-4 h-4" />
                   <span className="font-medium">Rời nhóm</span>
                 </div>
               </>
            )}
          </button>
        ) : (
          <button 
            onClick={handleJoinGroup}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Tham gia nhóm
          </button>
        )}
      </div>

      <InviteMemberModal
        isOpen={showInvitePopup}
        onClose={() => setShowInvitePopup(false)}
        groupId={groupId}
        contracts={contracts}
        currentUserAddress={address || ""}
      />

      <LeaveGroupModal
        isOpen={showLeavePopup}
        onClose={() => setShowLeavePopup(false)}
        onConfirm={handleLeaveGroup}
        isLoading={leavingGroup}
      />
    </>
  );
};

export default ActionHeader;