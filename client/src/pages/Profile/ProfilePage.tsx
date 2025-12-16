import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Modal from "react-modal";
import axiosClient from "../../api/axiosClient";
import { useAuth1 } from "../../context/Context";

// Import Components
import { ProfileInfoSidebar } from "./ProfileInfoSidebar";
import ProfileEditForm from "./ProfileEditForm";
import { ProfileHeader } from "./ProfileHeader";
import { ProfilePosts } from "./ProfilePosts";
import { assets } from "../../assets/assets";

// Types
interface IProfileData {
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

interface IUpdatedData {
  username?: string;
  bio?: string;
  birthDate?: string;
  local?: string;
  email?: string;
  relationshipStatus?: string;
  avatar?: string;
  coverPhotoUrl?: string;
}

// Cấu hình Modal root
Modal.setAppElement("#root");

const ProfilePage: React.FC = () => {
  const { user } = useAuth1();
  const [profileData, setProfileData] = useState<IProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.address) return;

      try {
        const res = await axiosClient.get(`/users/${user.address}`);
        if (res.data) {
          const u = res.data;
          setProfileData({
            _id: u._id,
            address: u.address,
            username: u.username || "Người dùng",
            bio: u.bio || "",
            email: u.email || "",
            relationshipStatus: u.relationshipStatus || "Độc thân",
            avatar: u.avatar || assets.profile_icon, // Fallback icon
            coverPhotoUrl: u.coverPhotoUrl || "",
            birthDate: u.birthDate ? u.birthDate.split("T")[0] : "",
            local: u.local || "",
          });
        }
      } catch (err) {
        console.error("Fetch profile error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = (updated: IUpdatedData) => {
    if (!profileData) return;
    // Ở đây bạn nên gọi API PUT/PATCH để lưu lên server trước
    setProfileData({ ...profileData, ...updated });
  };

  const handleAvatarClick = () => {
      // Logic upload avatar (mở modal hoặc input file)
      console.log("Click change avatar");
  };

  const handleCoverClick = () => {
      // Logic upload cover
      console.log("Click change cover");
  }

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // ===== NO DATA =====
  if (!profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <p className="text-lg font-medium">Không tìm thấy dữ liệu hồ sơ</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {/* 1. Header (Cover + Avatar + Name) */}
      <ProfileHeader 
        coverPhotoUrl={profileData.coverPhotoUrl}
        avatarUrl={profileData.avatar || assets.profile_icon}
        username={profileData.username}
        bio={profileData.bio} // Truyền bio xuống header nếu muốn hiển thị ngay dưới tên
        onAvatarClick={handleAvatarClick}
        onCoverClick={handleCoverClick}
      />

      {/* 2. Main Layout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Sidebar Info */}
          <div className="lg:col-span-1">
            <ProfileInfoSidebar
              username={profileData.username}
              bio={profileData.bio}
              local={profileData.local}
              birthDate={profileData.birthDate}
              relationshipStatus={profileData.relationshipStatus}
              email={profileData.email}
              onEdit={() => setIsEditOpen(true)}
            />
          </div>

          {/* Right Column: Posts */}
          <div className="lg:col-span-2">
            <ProfilePosts 
                posts={[]} // Truyền danh sách post thật vào đây
                avatarUrl={profileData.avatar}
            />
          </div>
        </div>
      </div>

      {/* 3. Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onRequestClose={() => setIsEditOpen(false)}
        className="outline-none"
        overlayClassName="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <div className="animate-in fade-in zoom-in duration-200 w-full max-w-lg">
            <ProfileEditForm
            initialData={profileData}
            onSave={(data) => {
                handleSave(data);
                setIsEditOpen(false);
            }}
            onCancel={() => setIsEditOpen(false)}
            />
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;