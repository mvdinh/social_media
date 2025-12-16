import React, { useEffect, useRef, useState } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import Modal from "react-modal";
import { create } from "ipfs-http-client";
import { assets } from "../assets/assets";
import ProfileEditForm from "./ProfileEditForm";
import axiosClient from "../api/axiosClient";
import getUrl  from "../utils/getUrl";
import { useAuth1 } from "../context/Context";
import { saveProfileToBlockchain } from "../helper/profileHelper";

// IPFS client
const ipfs = create({ host: "localhost", port: 5001, protocol: "http" });

export interface IProfileData {
  _id?: string;
  address?: string;
  username: string;
  bio: string;
  email: string;
  relationshipStatus: string;
  avatar: string;
  coverPhotoUrl: string;
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

const Profile: React.FC = () => {
  const { user } = useAuth1();

  const [profileData, setProfileData] = useState<IProfileData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>(assets.sample_cover);

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRefCover = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?._id) return;
        const response = await axiosClient.get(`/user/${user._id}`);
        if (response.data.success) {
          const apiUser = response.data.user;
          const mappedData: IProfileData = {
            _id: apiUser._id,
            address: apiUser.address,
            username: apiUser.username || "Người dùng",
            bio: apiUser.bio || "",
            email: apiUser.email || "",
            relationshipStatus: apiUser.relationshipStatus || "Độc thân",
            avatar: apiUser.avatarIpfsHash || apiUser.avatar || "",
            coverPhotoUrl: apiUser.coverImageIpfsHash || apiUser.coverImage || "",
            birthDate: apiUser.dob ? apiUser.dob.split("T")[0] : "",
            local: apiUser.hometown || "",
          };
          setProfileData(mappedData);
          setAvatarPreviewUrl(getUrl(mappedData.avatar) || assets.sample_cover);
        }
      } catch (err) {
        setError("Không thể tải dữ liệu hồ sơ.");
      }
    };
    fetchData();
  }, [user]);

  // Update preview when avatar changes
  useEffect(() => {
    if (profileData?.avatar) {
      setAvatarPreviewUrl(getUrl(profileData.avatar) || assets.sample_cover);
    }
  }, [profileData?.avatar]);

  // Handle save (Blockchain + DB)
  const handleSave = async (updatedData: IUpdatedData) => {
    setLoading(true);
    setError("");
    try {
      const fullProfileData = { ...profileData, ...updatedData, updatedAt: new Date().toISOString() };
      let metaCid = "";
      try {
        metaCid = await saveProfileToBlockchain(fullProfileData);
      } catch {}

      const dbPayload = {
        username: updatedData.username,
        bio: updatedData.bio,
        email: updatedData.email,
        relationshipStatus: updatedData.relationshipStatus,
        dob: updatedData.birthDate,
        hometown: updatedData.local,
        avatarCid: updatedData.avatar,
        coverCid: updatedData.coverPhotoUrl,
        metadataCid: metaCid,
      };

      await axiosClient.put("/user/profile", dbPayload);
      setProfileData((prev) => (prev ? { ...prev, ...updatedData } : undefined));
      setIsEditModalOpen(false);
    } catch {
      setError("Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  // Handle file upload
  const captureFiles = async (event: React.ChangeEvent<HTMLInputElement>, imageType: "avatar" | "coverPhotoUrl") => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");
    try {
      const added = await ipfs.add(file);
      const cid = added.path;
      const updatePayload: IUpdatedData = imageType === "avatar" ? { avatar: cid } : { coverPhotoUrl: cid };
      await handleSave(updatePayload);
      if (imageType === "avatar") setAvatarPreviewUrl(getUrl(cid));
    } catch {
      setError("Lỗi khi upload ảnh");
    } finally {
      if (imageType === "avatar" && fileInputRef.current) fileInputRef.current.value = "";
      if (imageType === "coverPhotoUrl" && fileInputRefCover.current) fileInputRefCover.current.value = "";
      setUploadingImage(false);
      setIsMenuOpen(false);
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAvatarClick = () => setIsMenuOpen(!isMenuOpen);
  const handleMenuSelect = (action: string) => {
    if (action === "view") setIsModalOpen(true);
    if (action === "choose") fileInputRef.current?.click();
    setIsMenuOpen(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen relative">
      {(loading || uploadingImage) && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex flex-col items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="text-lg font-medium">
            {uploadingImage ? "Đang upload ảnh & chờ ký ví..." : "Đang lưu thay đổi..."}
          </p>
        </div>
      )}

      <div className="bg-white shadow-md">
        <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-gray-200 group">
          <img
            src={getUrl(profileData?.coverPhotoUrl) || assets.sample_cover}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg hover:bg-white transition cursor-pointer flex items-center gap-2 group-hover:opacity-100 opacity-80 z-10"
            onClick={() => fileInputRefCover.current?.click()}
          >
            <Camera className="w-5 h-5 text-gray-700" />
            <span className="hidden sm:inline text-sm font-medium text-gray-700">Thêm ảnh bìa</span>
            <input
              type="file"
              ref={fileInputRefCover}
              className="hidden"
              onChange={(e) => captureFiles(e, "coverPhotoUrl")}
              accept="image/*"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 md:-mt-12 pb-4">
            <div className="relative inline-block" ref={menuRef}>
              <div
                className="h-40 w-40 md:h-44 md:w-44 rounded-full border-4 border-white shadow-lg overflow-hidden flex-shrink-0 z-10 cursor-pointer bg-white relative group"
                onClick={handleAvatarClick}
              >
                <img src={avatarPreviewUrl} alt="Avatar" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center transition">
                  <Camera className="w-8 h-8 text-white opacity-80" />
                </div>
              </div>

              {isMenuOpen && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border border-gray-100 overflow-hidden">
                  <ul className="py-1 text-gray-700 text-sm">
                    <li
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                      onClick={() => handleMenuSelect("view")}
                    >
                      Xem ảnh đại diện
                    </li>
                    <li
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-t border-gray-100"
                      onClick={() => handleMenuSelect("choose")}
                    >
                      Chọn ảnh đại diện
                    </li>
                  </ul>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => captureFiles(e, "avatar")}
                    accept="image/*"
                  />
                </div>
              )}
            </div>

            <div className="ml-0 md:ml-4 mt-4 md:mt-0 flex-grow pt-10 md:pt-0 mb-2 md:mb-8 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900">{profileData?.username}</h1>
              <p className="text-gray-500 text-base mt-1">150 bạn bè</p>
            </div>

            <div className="mb-8 flex gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Chỉnh sửa trang cá nhân
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 flex gap-1 h-12 items-center overflow-x-auto no-scrollbar">
            <button className="px-4 h-full text-blue-600 border-b-2 border-blue-600 font-medium whitespace-nowrap">Bài viết</button>
            <button className="px-4 h-full text-gray-600 hover:bg-gray-50 font-medium rounded-lg whitespace-nowrap">Giới thiệu</button>
            <button className="px-4 h-full text-gray-600 hover:bg-gray-50 font-medium rounded-lg whitespace-nowrap">Bạn bè</button>
            <button className="px-4 h-full text-gray-600 hover:bg-gray-50 font-medium rounded-lg whitespace-nowrap">Ảnh</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Giới thiệu</h2>

              {profileData?.bio && (
                <div className="text-center pb-4 border-b border-gray-100">
                  <p className="text-gray-800 text-sm">{profileData.bio}</p>
                </div>
              )}

              <div className="space-y-3 text-sm text-gray-700">
                {profileData?.local && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📍</span> Sống tại <strong>{profileData.local}</strong>
                  </div>
                )}
                {profileData?.birthDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎂</span> Sinh ngày <strong>{profileData.birthDate}</strong>
                  </div>
                )}
                {profileData?.relationshipStatus && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">❤️</span> {profileData.relationshipStatus}
                  </div>
                )}
                {profileData?.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📧</span> {profileData.email}
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
              >
                Chỉnh sửa chi tiết
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500 h-40 flex items-center justify-center">
              Danh sách bài viết sẽ hiển thị ở đây...
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
            onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={avatarPreviewUrl}
            alt="Zoomed Avatar"
            className="max-w-[95vw] max-h-[90vh] rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => !loading && setIsEditModalOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
        overlayClassName="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      >
        {profileData && (
          <ProfileEditForm
            initialData={profileData}
            onSave={handleSave}
            onCancel={() => setIsEditModalOpen(false)}
            isSaving={loading}
            saveError={error}
          />
        )}
      </Modal>
    </div>
  );
};

export default Profile;
