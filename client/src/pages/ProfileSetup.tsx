import { useState } from "react";
import { useNavigate } from "react-router-dom";
import saveProfileToBlockchain from "../service/savetoBlockchain";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const pendingWalletAddress = localStorage.getItem("pendingWalletAddress");

  const [formData, setFormData] = useState({
    username: "",
    avatar: "https://example.com/default-avatar.png",
    coverPhotoUrl: "https://example.com/default-cover.png",
    local: "",
    email: "",
    bio: "",
    birthDate: "",
    relationshipStatus: "Độc thân",
    gender: "Khác",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      alert("Tên người dùng (Username) là bắt buộc!");
      return;
    }
    setIsLoading(true);

    try {
      const receipt = await saveProfileToBlockchain(formData);
      console.log("Giao dịch hoàn tất:", receipt);

      if (receipt) {
        localStorage.setItem("metamaskConnected", "true");
        localStorage.removeItem("pendingWalletAddress");

        alert(`Chào mừng ${formData.username}! Hồ sơ đã được tạo thành công.`);
        navigate("/", { replace: true });
      } else {
        alert("Lỗi khi lưu hồ sơ. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi API:", error);
      alert("Đã xảy ra lỗi hệ thống. Vui lòng kiểm tra console.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Hoàn Tất Hồ Sơ SocialX
        </h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Bạn là người dùng mới. Vui lòng thiết lập thông tin bắt buộc.
        </p>

        <div className="bg-gray-50 p-3 rounded-lg mb-6">
          <span className="text-xs font-medium text-gray-700 block">
            Địa chỉ ví của bạn:
          </span>
          <span className="text-sm font-mono text-indigo-600 break-all">
            {pendingWalletAddress || "Đang tải..."}
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* TRƯỜNG BẮT BUỘC: USERNAME */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Tên người dùng (Username) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              id="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="Ví dụ: crypto_master123"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* TRƯỜNG EMAIL */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ví dụ: yourname@example.com"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* TRƯỜNG ĐỊA PHƯƠNG */}
          <div>
            <label
              htmlFor="local"
              className="block text-sm font-medium text-gray-700"
            >
              Địa phương (Local)
            </label>
            <input
              type="text"
              name="local"
              id="local"
              value={formData.local}
              onChange={handleChange}
              placeholder="Ví dụ: Hà Nội, Việt Nam"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <hr className="border-gray-200" />

          {/* 🌟 THÔNG TIN CHI TIẾT CÁ NHÂN 🌟 */}

          {/* Ngày sinh */}
          <div>
            <label
              htmlFor="birthDate"
              className="block text-sm font-medium text-gray-700"
            >
              Ngày sinh
            </label>
            <input
              type="date"
              name="birthDate"
              id="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Giới tính & Trạng thái Quan hệ (Select Fields) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Giới tính */}
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700"
              >
                Giới tính
              </label>
              <select
                name="gender"
                id="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            {/* Trạng thái Quan hệ */}
            <div>
              <label
                htmlFor="relationshipStatus"
                className="block text-sm font-medium text-gray-700"
              >
                Trạng thái Quan hệ
              </label>
              <select
                name="relationshipStatus"
                id="relationshipStatus"
                value={formData.relationshipStatus}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="Độc thân">Độc thân</option>
                <option value="Đang hẹn hò">Đang hẹn hò</option>
                <option value="Đã kết hôn">Đã kết hôn</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          {/* Ảnh Bìa (Cover Photo - Giữ là trường ẩn/mặc định nếu không có upload logic) */}
          {/* Để đơn giản, ta giữ coverPhotoUrl mặc định hoặc có thể cho phép nhập URL */}
          <hr className="border-gray-200" />

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            }`}
          >
            {isLoading ? "Đang xử lý..." : "Hoàn Tất Đăng Ký"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;