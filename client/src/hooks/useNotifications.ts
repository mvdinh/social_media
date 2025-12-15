import { useState, useEffect, useCallback } from "react";
import axios from "axios"; 
import { useAuth1 } from "../context/Context";

// Đổi URL này theo đúng backend của bạn
const API_URL = "http://localhost:5000/api"; 

export const useNotifications = () => {
  const { user } = useAuth1();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Hàm gọi API lấy danh sách
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token"); // Hoặc lấy từ Context
      
      const res = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Giả sử API trả về mảng object notifications
      setNotifications(res.data);
    } catch (err) {
      console.error("Lỗi lấy thông báo:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 2. Gọi lần đầu khi mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 3. Các hàm xử lý đọc
  const markAsRead = async (id) => {
     // ... logic gọi API mark read ...
     // Sau khi gọi API xong, cập nhật state cục bộ để UI phản hồi nhanh
     setNotifications(prev => prev.map(n => n._id === id ? {...n, isRead: true} : n));
  };

  const markAllAsRead = async () => {
     // ... logic gọi API mark all read ...
     setNotifications(prev => prev.map(n => ({...n, isRead: true})));
  };

  return {
    notifications,
    loading,
    refetch: fetchNotifications, // Xuất hàm này để Layout dùng
    markAsRead,
    markAllAsRead
  };
};