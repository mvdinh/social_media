import React from "react";
import { MapPin, Gift, Heart, Mail, Info, Edit3 } from "lucide-react";

interface ProfileInfoSidebarProps {
  username: string;
  bio?: string;
  local?: string;
  birthDate?: string;
  relationshipStatus?: string;
  email?: string;
  onEdit: () => void;
}

export const ProfileInfoSidebar: React.FC<ProfileInfoSidebarProps> = ({
  username,
  bio,
  local,
  birthDate,
  relationshipStatus,
  email,
  onEdit,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Info size={20} className="text-blue-600" />
          Giới thiệu
        </h2>
        <button 
          onClick={onEdit}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
        >
           Sửa
        </button>
      </div>

      <div className="p-5 space-y-5">
        {bio && (
          <div className="text-center">
            <p className="text-gray-700 italic">"{bio}"</p>
          </div>
        )}

        <div className="space-y-4">
          <InfoItem icon={<MapPin size={18} />} label="Sống tại" value={local} />
          <InfoItem icon={<Gift size={18} />} label="Sinh ngày" value={birthDate} />
          <InfoItem icon={<Heart size={18} />} label="Tình trạng" value={relationshipStatus} />
          <InfoItem icon={<Mail size={18} />} label="Email" value={email} />
        </div>

        <button
          onClick={onEdit}
          className="w-full py-2.5 mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm"
        >
          <Edit3 size={16} />
          Chỉnh sửa chi tiết
        </button>
      </div>
    </div>
  );
};

// Helper component nhỏ gọn
const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-gray-700">
      <div className="mt-0.5 text-gray-500">{icon}</div>
      <div>
        <span className="block text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
};