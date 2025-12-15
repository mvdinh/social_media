import React, { useEffect, useRef, useState } from "react";
import { MoreHorizontal, ChevronDown, X } from "lucide-react";
import { ethers } from "ethers";
import { Buffer } from "buffer";
import { create } from "ipfs-http-client";
import Modal from "react-modal";
import { assets } from "../assets/assets";
import {
  fetchProfileDataFromIPFS,
  getProfileCID,
} from "../service/getProfileUser";
import saveProfileToBlockchain from "../service/savetoBlockchain";
import ProfileEditForm from "./ProfileEditForm";

// Cần đảm bảo component ProfileEditForm nhận các props sau
export interface IUpdatedData {
  username?: string;
  bio?: string;
  birthDate?: Date | string | null; // Có thể là Date object khi gửi từ form
  local?: string;
  email?: string;
  relationshipStatus?: string;
}

export interface IProfileData {
  username: string;
  bio: string;
  avatar: string;
  coverPhotoUrl: string;
  birthDate: string; // Lưu trữ/Hiển thị là string 'YYYY-MM-DD'
  local: string;
  email: string;
  relationshipStatus: string;
}

const ipfs = create({ host: "localhost", port: 5001, protocol: "http" });

Modal.setAppElement("#root");

const Profile: React.FC = () => {
  const [profileData, setProfileData] = useState<IProfileData | undefined>(
    undefined
  );
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  const [error, setError] = useState<string>("");

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>(
    assets.sample_cover
  );

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRefCover = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const userAddress: string = await signer.getAddress();

        const cid: string = await getProfileCID(userAddress);

        console.log("Đã lấy về CID:", cid);

        if (cid) {
          const profile: IProfileData = await fetchProfileDataFromIPFS(cid);
          console.log("Đã tải về Profile:", profile);
          setProfileData(profile);
          setAvatarPreviewUrl(profile.avatar || assets.sample_cover);
        } else {
          console.log("Không tìm thấy CID, hiển thị dữ liệu mặc định.");
          const defaultProfile: IProfileData = {
            username: userAddress,
            bio: "",
            avatar: assets.sample_cover,
            coverPhotoUrl: assets.sample_cover,
            birthDate: "",
            local: "",
            email: "",
            relationshipStatus: "",
          };
          setProfileData(defaultProfile);
          setAvatarPreviewUrl(assets.sample_cover);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu profile:", error);
      }
    };

    fetchData();
  }, []);
  const handleAvatarClick = (): void => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleMenuSelect = (action: "view" | "choose"): void => {
    if (action === "view") {
      setIsModalOpen(true);
    } else if (action === "choose") {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleSetProfile = (): void => {
    setError("");
    setIsEditModalOpen(true);
  };

  const handleSave = async (updatedData: IUpdatedData) => {
    if (!profileData) {
      setError("Lỗi: Không tìm thấy dữ liệu profile gốc để cập nhật.");
      return;
    }

    const finalData: IProfileData = {
      username: updatedData.username || profileData.username,
      bio: updatedData.bio || profileData.bio,
      local: updatedData.local || profileData.local,
      email: updatedData.email || profileData.email,
      relationshipStatus:
        updatedData.relationshipStatus || profileData.relationshipStatus,

      birthDate: updatedData.birthDate
        ? updatedData.birthDate instanceof Date
          ? updatedData.birthDate.toISOString().split("T")[0]
          : (updatedData.birthDate as string)
        : profileData.birthDate,

      // Giữ nguyên Avatar & Cover URL
      avatar: profileData.avatar,
      coverPhotoUrl: profileData.coverPhotoUrl,
    };

    setLoading(true);
    setError("");

    try {
      await saveProfileToBlockchain(finalData);
      setProfileData(finalData);
      setIsEditModalOpen(false);
      alert("Cập nhật Profile và lưu CID lên Blockchain thành công!");
    } catch (err) {
      console.error("Lỗi khi lưu Profile/Blockchain:", err);
      let errorMessage =
        (err as Error).message || "Lỗi không xác định khi lưu profile.";

      if (
        errorMessage.includes("fetch failed") ||
        (err as any).code === "ECONNREFUSED"
      ) {
        errorMessage =
          "Không thể kết nối với IPFS Node cục bộ (localhost:5001). Vui lòng chạy lệnh 'ipfs daemon'.";
      } else if (errorMessage.includes("user rejected transaction")) {
        errorMessage =
          "Giao dịch đã bị từ chối bởi người dùng (MetaMask/Wallet).";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const captureFiles = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: "avatar" | "coverPhotoUrl" // ✨ THÊM THAM SỐ XÁC ĐỊNH LOẠI ẢNH
  ) => {
    event.preventDefault();
    const uploadedFile = event.target.files?.[0];

    // 1. Kiểm tra tính hợp lệ của file
    if (!uploadedFile) {
      setError(
        `Vui lòng chọn một file để upload ${
          imageType === "avatar" ? "ảnh đại diện" : "ảnh bìa"
        }.`
      );
      if (imageType === "avatar" && fileInputRef.current) {
        fileInputRef.current.value = "";
      } else if (imageType === "coverPhotoUrl" && fileInputRefCover.current) {
        fileInputRefCover.current.value = "";
      }
      return;
    }

    const fileToUpload = uploadedFile;
    setLoading(true);
    setError("");
    setIsMenuOpen(false);
    try {
      const buffer: Buffer = await new Promise((resolve, reject) => {
        const reader = new window.FileReader();
        reader.onloadend = () => {
          if (reader.error) {
            console.error("FileReader encountered an error:", reader.error);
            return reject(reader.error);
          }
          const arrayBuffer = reader.result as ArrayBuffer;
          resolve(Buffer.from(arrayBuffer));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(fileToUpload);
      });

      // 4. Upload ảnh lên IPFS
      console.log(`Đang tải ${imageType} lên IPFS...`);
      const result = await ipfs.add(buffer);
      const newCid = result.cid.toString();
      console.log(`✅ Upload ${imageType} thành công! CID: ${newCid}`);

      // 5. Cập nhật Profile Metadata
      if (!profileData) {
        throw new Error(
          "Dữ liệu profile gốc chưa được tải. Không thể cập nhật ảnh."
        );
      }

      const newImageUrl = `https://ipfs.io/ipfs/${newCid}`;

      const newProfileData = {
        ...profileData,
        [imageType]: newImageUrl,
      };

      console.log("Đang cập nhật Profile Data (Metadata) sau khi đổi ảnh...");
      await saveProfileToBlockchain(newProfileData);

      // 8. Cập nhật UI State và Hoàn tất
      setProfileData(newProfileData);
      if (imageType === "avatar") {
        setAvatarPreviewUrl(newImageUrl);
      }
    } catch (err) {
      // 9. Xử lý lỗi
      console.error("Lỗi upload, đọc file, hoặc lưu Blockchain:", err);
      // ... (Xử lý lỗi như cũ)
      let errorMessage = (err as Error).message || "Lỗi không xác định.";

      if (
        errorMessage.includes("fetch failed") ||
        (err as any).code === "ECONNREFUSED"
      ) {
        errorMessage =
          "Không thể kết nối với IPFS Node cục bộ (localhost:5001). Vui lòng chạy lệnh 'ipfs daemon'.";
      }
      setError(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
      if (imageType === "avatar" && fileInputRef.current) {
        fileInputRef.current.value = "";
      } else if (imageType === "coverPhotoUrl" && fileInputRefCover.current) {
        fileInputRefCover.current.value = "";
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // const buttonClass: string =
  //   "flex items-center justify-center h-9 px-3 rounded-lg font-semibold text-sm transition duration-150";
  const handleAvatarCoverClick = (): void => {
    if (fileInputRefCover.current) {
      fileInputRefCover.current.click();
    }
  };
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-white shadow-md">
        <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-gray-200">
          <img
            src={profileData?.coverPhotoUrl || "placeholder-cover.jpg"}
            alt="Cover Photo"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute bottom-4 right-4 bg-white rounded-lg p-2 shadow-xl hover:bg-gray-100 transition cursor-pointer flex items-center space-x-1"
            onClick={handleAvatarCoverClick}
            aria-label="Change cover photo"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-1.414-1.414A2 2 0 0011.586 3H8.414a2 2 0 00-1.414.586L5.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              ></path>
            </svg>
            <span className="hidden sm:inline text-sm font-medium text-gray-700">
              Thêm ảnh bìa
            </span>
            <input
              type="file"
              id="cover-upload"
              ref={fileInputRefCover}
              style={{ display: "none" }}
              onChange={(e) => {
                captureFiles(e, "coverPhotoUrl");
              }}
              accept="image/*"
            />
          </div>
        </div>

        {/* Thông tin Page (Profile Info) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 md:-mt-12 pb-4">
            {/* Ảnh đại diện (Avatar) */}
            <div className="relative inline-block" ref={menuRef}>
              <div
                className="h-40 w-40 md:h-44 md:w-44 rounded-full border-4 border-white shadow-lg overflow-hidden flex-shrink-0 z-10 cursor-pointer"
                onClick={handleAvatarClick}
              >
                <img
                  src={profileData?.avatar}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />

                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-70">
                    <span className="text-white text-xs text-center p-2">
                      Lỗi!
                    </span>
                  </div>
                )}
                {/* Biểu tượng camera */}
                <div className="absolute bottom-1 right-1 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition">
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-1.414-1.414A2 2 0 0011.586 3H8.414a2 2 0 00-1.414.586L5.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </div>

              {isMenuOpen && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-64 bg-white rounded-lg shadow-xl z-20 border border-gray-100">
                  {/* Mũi tên trỏ lên */}
                  <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"></div>

                  <ul className="py-2 text-gray-700">
                    {/* Tùy chọn 1: Xem ảnh đại diện */}
                    <li
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleMenuSelect("view")}
                    >
                      <svg
                        className="w-5 h-5 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        ></path>
                      </svg>
                      Xem ảnh đại diện
                    </li>

                    <li
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                    >
                      <svg
                        className="w-5 h-5 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L15 15m0 0l4.586-4.586a2 2 0 012.828 0L20 18m-5-3l1.5-1.5"
                        ></path>
                      </svg>
                      Chọn ảnh đại diện
                      <input
                        type="file"
                        id="avatar-upload"
                        style={{ display: "none" }}
                        ref={fileInputRef}
                        onChange={(e) => captureFiles(e, "avatar")}
                      />
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-2 text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <div className="ml-0 md:ml-4 mt-4 md:mt-0 flex-grow pt-8 md:pt-0 mb-10">
              <h1 className="text-3xl font-bold text-gray-900">
                {profileData?.username}
              </h1>
              <p className="text-gray-500 text-base mt-1">
                <span className="font-semibold text-gray-700">
                  150 người bạn
                </span>
              </p>
              {/* 
              <div className="flex space-x-2 mt-3 mb-4">
                <button
                  className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Nhắn tin
                </button>
                <button
                  className={`${buttonClass} bg-gray-200 text-gray-800 hover:bg-gray-300`}
                >
                  <ThumbsUp className="h-4 w-4 mr-1.5" />
                  Theo dõi
                </button>
                <button
                  className={`${buttonClass} bg-gray-200 text-gray-800 hover:bg-gray-300`}
                >
                  <Search className="h-4 w-4 mr-1.5" />
                  Tìm kiếm
                </button>
              </div> */}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14">
              <div className="flex space-x-1">
                {[
                  "Bài viết",
                  "Giới thiệu",
                  "Lượt nhắc",
                  "Đánh giá",
                  "Reels",
                  "Ảnh",
                ].map((tab, index) => (
                  <button
                    key={tab}
                    className={`h-full px-4 text-sm font-medium ${
                      index === 0
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:bg-gray-100 rounded-lg"
                    }`}
                  >
                    {tab}
                  </button>
                ))}

                <button className="flex items-center px-3 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                  Xem thêm
                  <ChevronDown className="h-4 w-4 ml-1" />
                </button>
              </div>

              <button className="h-9 w-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-800 hover:bg-gray-300">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            {/* START: CARD GIỚI THIỆU ĐÃ SỬA ĐỔI */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-3 flex justify-between items-center">
                Thông tin cá nhân
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  onClick={() => handleSetProfile()}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </h2>
              {profileData?.bio && (
                <p className="text-gray-800 mb-4 text-sm italic">
                  {profileData.bio}
                </p>
              )}

              <div className="space-y-3 text-gray-700">
                {/* Sống ở */}
                {profileData?.local && (
                  <div className="flex items-center space-x-3">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      {" "}
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />{" "}
                    </svg>
                    <span>Sống ở {profileData.local}</span>
                  </div>
                )}

                {/* Quê quán / Địa chỉ (Giả sử bạn dùng profileData.local cho cả hai) */}
                {profileData?.local && (
                  <div className="flex items-center space-x-3">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      {" "}
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />{" "}
                    </svg>
                    <span>Từ {profileData.local}</span>
                  </div>
                )}

                {/* Ngày sinh */}
                {profileData?.birthDate && (
                  <div className="flex items-center space-x-3">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      {" "}
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />{" "}
                    </svg>
                    <span>{profileData.birthDate}</span>
                  </div>
                )}

                {/* Tình trạng */}
                {profileData?.relationshipStatus && (
                  <div className="flex items-center space-x-3">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-1a1 1 0 00-1 1v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-1a1 1 0 00-1-1H4a1 1 0 01-1-1V4z"
                        clipRule="evenodd"
                        fillRule="evenodd"
                      />
                    </svg>
                    <span>{profileData.relationshipStatus}</span>
                  </div>
                )}
              </div>
              <hr className="my-3 border-gray-200" />
            </div>
          </div>
          <div className="md:col-span-2 space-y-6">
            {/* ... (Các card khác: Đăng chú ý, Tạo bài viết) */}
            <div className="bg-white p-4 rounded-lg shadow">
              {" "}
              <h2 className="text-xl font-bold mb-3">Đăng chú ý</h2>{" "}
              <div className="h-20 bg-gray-50 border border-gray-200 rounded p-3">
                Nội dung bài ghim{" "}
              </div>{" "}
            </div>{" "}
            <div className="bg-white p-4 rounded-lg shadow">
              {" "}
              <h2 className="text-xl font-bold mb-3">Tạo bài viết</h2>{" "}
              <div className="h-16 bg-gray-50 border border-gray-200 rounded p-3">
                Ô nhập nội dung...{" "}
              </div>{" "}
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL XEM ẢNH PHÓNG TO */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setIsModalOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
            onClick={() => setIsModalOpen(false)}
            aria-label="Đóng ảnh"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Container Ảnh Phóng To */}
          <div
            className="max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={avatarPreviewUrl}
              alt="Ảnh Đại Diện Phóng To"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            {/* Tên người dùng hiển thị phía dưới ảnh (Tùy chọn) */}
            <div className="text-center mt-3 text-white text-xl font-semibold">
              {profileData?.username}'s Profile Picture
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL CHỈNH SỬA PROFILE */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => !loading && setIsEditModalOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
        overlayClassName="fixed inset-0 z-40"
        style={{ overlay: { backgroundColor: "rgba(0, 0, 0, 0.7)" } }}
        contentLabel="Chỉnh sửa hồ sơ"
      >
        {profileData ? (
          <ProfileEditForm
            initialData={profileData}
            onSave={handleSave}
            onCancel={() => setIsEditModalOpen(false)}
            isSaving={loading}
            saveError={error}
          />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl text-center">
            Đang tải dữ liệu Profile...
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Profile;