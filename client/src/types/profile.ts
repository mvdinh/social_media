// Interface hiển thị và quản lý State ở Frontend
export interface IProfileData {
  _id?: string;
  address?: string;
  username: string;
  bio: string;
  avatar: string;         // URL hiển thị (Gateway)
  coverPhotoUrl: string;  // Mapping từ DB: coverImage
  birthDate: string;      // Mapping từ DB: dob (dạng YYYY-MM-DD)
  local: string;          // Mapping từ DB: hometown
  email: string;
  relationshipStatus: string;
  
  // Các trường ẩn dùng cho logic (nếu cần)
  avatarIpfsHash?: string; 
  coverImageIpfsHash?: string;
}

// Interface dữ liệu gửi đi cập nhật
export interface IUpdatedData {
  username?: string;
  bio?: string;
  birthDate?: string;
  local?: string;
  email?: string;
  relationshipStatus?: string;
}