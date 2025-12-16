// ProfileEditForm.tsx
import React, { useState, useEffect } from "react";
import { FaSave, FaTimes } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import type { IProfileData, IUpdatedData } from "./Profile";

interface ProfileEditFormProps {
  initialData: IProfileData;
  onSave: (updatedData: IUpdatedData) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const [formData, setFormData] = useState<IUpdatedData>({
    username: initialData.username || "",
    bio: initialData.bio || "",
    email: initialData.email || "",
    birthDate: initialData.birthDate || "",
    local: initialData.local || "",
    relationshipStatus: initialData.relationshipStatus || "Độc thân",
  });

  useEffect(() => {
    setFormData({
      username: initialData.username || "",
      bio: initialData.bio || "",
      email: initialData.email || "",
      birthDate: initialData.birthDate || "",
      local: initialData.local || "",
      relationshipStatus: initialData.relationshipStatus || "Độc thân",
    });
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="text-xl font-bold text-gray-800">Chỉnh Sửa Thông Tin</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <FaTimes />
        </button>
      </div>

      {/* BODY */}
      <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tên hiển thị</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Quê quán</label>
            <input
              type="text"
              name="local"
              value={formData.local}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email liên hệ</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Birthday & Relationship */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mối quan hệ</label>
              <select
                name="relationshipStatus"
                value={formData.relationshipStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
              >
                <option value="Độc thân">Độc thân</option>
                <option value="Đang hẹn hò">Đang hẹn hò</option>
                <option value="Đã kết hôn">Đã kết hôn</option>
                <option value="Phức tạp">Phức tạp</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tiểu sử</label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
            />
          </div>

          {/* Submit & Cancel */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> Đang lưu...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" /> Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditForm;
