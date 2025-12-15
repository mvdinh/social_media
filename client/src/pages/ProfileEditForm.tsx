// ProfileEditForm.jsx

import { useState, useEffect } from "react";
import { FaSave, FaTimes } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import type { IProfileData, IUpdatedData } from "./Profile";

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
  // Hàm chuẩn bị giá trị ngày tháng cho input type="date"
  const formatBirthDate = (
    dateValue: string | Date | null | undefined
  ): string => {
    if (!dateValue) return "";
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split("T")[0];
    }
    // Giữ nguyên nếu đã là string 'YYYY-MM-DD' (từ Profile.tsx)
    return dateValue;
  };

  const [formData, setFormData] = useState({
    username: initialData.username || "",
    email: initialData.email || "",
    birthDate: formatBirthDate(initialData.birthDate),
    relationshipStatus: initialData.relationshipStatus || "Độc thân",
    local: initialData.local || "",
    bio: initialData.bio || "",
  });

  // Cập nhật state khi initialData thay đổi (ví dụ: sau khi fetch xong)
  useEffect(() => {
    setFormData({
      username: initialData.username || "",
      email: initialData.email || "",
      birthDate: formatBirthDate(initialData.birthDate),
      relationshipStatus: initialData.relationshipStatus || "Độc thân",
      local: initialData.local || "",
      bio: initialData.bio || "",
    });
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    const dataToSave = {
      ...formData,
      birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
    };

    onSave(dataToSave);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        Chỉnh Sửa Thông Tin Cá Nhân
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tên người dùng (Username)
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Local (Địa phương) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Địa phương/Nơi sinh sống
          </label>
          <input
            type="text"
            name="local"
            value={formData.local}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Ngày sinh và Trạng thái */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ngày sinh
            </label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trạng thái quan hệ
            </label>
            <select
              name="relationshipStatus"
              value={formData.relationshipStatus}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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
          <label className="block text-sm font-medium text-gray-700">
            Tiểu sử (Bio)
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        {/* Hiển thị lỗi từ quá trình lưu */}
        {saveError && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-md">
            <span className="font-semibold">Lỗi:</span> {saveError}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
            disabled={isSaving}
          >
            <FaTimes className="inline mr-2" /> Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang lưu...
              </span>
            ) : (
              <span className="flex items-center">
                <FaSave className="inline mr-2" /> Lưu Thay Đổi
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditForm;