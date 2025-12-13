import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth1 } from "./Context"; // Lấy thông tin user đang login

const SOCKET_URL = "http://localhost:3000"; // URL Backend

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[]; // Danh sách user đang online (nếu cần)
}

const SocketContext = createContext<SocketContextType>({ socket: null, onlineUsers: [] });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth1(); // Lấy user từ AuthContext

  useEffect(() => {
    // Tạo kết nối mới
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"], // Bắt buộc dùng websocket cho nhanh
      reconnection: true,
    });

    // Nếu user đã đăng nhập, đăng ký address với server ngay
    if (user?.address) {
        newSocket.emit("register_user", user.address);
    }

    setSocket(newSocket);

    // Cleanup khi App đóng
    return () => {
      newSocket.disconnect();
    };
  }, [user?.address]); // Chạy lại khi user thay đổi (Login/Logout)

  return (
    <SocketContext.Provider value={{ socket, onlineUsers: [] }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);