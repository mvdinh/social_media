import React, { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Heart, 
  FileText, 
  X, 
  Save, 
  Loader2 
} from "lucide-react";

export interface IProfileData {
  _id?: string;
  address?: string;
  username: string;
  bio: string;
  email: string;
  relationshipStatus: string;
  avatar?: string;
  coverPhotoUrl?: string;
  birthDate: string;
  local: string;
}

export interface IUpdatedData {
  username?: string;
  bio?: string;
  birthDate?: string;
  local?: string;
  email?: string;
  relationshipStatus?: string;
  avatar?: string;
  coverPhotoUrl?: string;
}

interface ProfileEditFormProps {
  initialData: IProfileData;
  onSave: (updatedData: IUpdatedData) => void;
  onCancel: () => void;
  isSaving?: boolean;
  saveError?: string;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
  saveError = "",
}) => {
  const [formData, setFormData] = useState<IUpdatedData>({ ...initialData });

  useEffect(() => {
    setFormData({ ...initialData });
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSaving) onSave(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      {/* --- HEADER --- */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="text-xl font-bold text-gray-800">Chỉnh sửa trang cá nhân</h3>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      {/* --- FORM BODY (Scrollable) --- */}
      <div className="p-6 overflow-y-auto custom-scrollbar">
        <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Thông tin cơ bản */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Thông tin cơ bản</h4>
            
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-800"
                  placeholder="Nhập tên của bạn"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiểu sử</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FileText size={18} className="text-gray-400" />
                </div>
                <textarea
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-800 resize-none"
                  placeholder="Mô tả ngắn về bản thân..."
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section: Chi tiết */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Chi tiết cá nhân</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* Local */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quê quán / Nơi sống</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="local"
                    value={formData.local}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Hà Nội, Việt Nam"
                  />
                </div>
              </div>

              {/* BirthDate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* Relationship Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng mối quan hệ</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Heart size={18} className="text-gray-400" />
                  </div>
                  <select
                    name="relationshipStatus"
                    value={formData.relationshipStatus}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition appearance-none"
                  >
                    <option value="Độc thân">Độc thân</option>
                    <option value="Đang hẹn hò">Đang hẹn hò</option>
                    <option value="Đã kết hôn">Đã kết hôn</option>
                    <option value="Phức tạp">Phức tạp</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {saveError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              ⚠️ {saveError}
            </div>
          )}
        </form>
      </div>

      {/* --- FOOTER --- */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-5 py-2.5 text-gray-700 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          Hủy bỏ
        </button>
        <button 
          type="submit" 
          form="profile-form"
          disabled={isSaving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
};

export default ProfileEditForm;