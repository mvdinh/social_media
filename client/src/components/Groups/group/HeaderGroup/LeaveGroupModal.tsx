import React from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface LeaveGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const LeaveGroupModal = ({ isOpen, onClose, onConfirm, isLoading }: LeaveGroupModalProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-5 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Rời khỏi nhóm?</h3>
          <p className="text-gray-500 text-sm">
            Bạn có chắc chắn muốn rời khỏi nhóm này không? Bạn sẽ không thể xem nội dung nhóm trừ khi tham gia lại.
          </p>
        </div>
        
        <div className="flex border-t border-gray-100 bg-gray-50 p-4 gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rời nhóm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveGroupModal;