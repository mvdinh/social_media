// src/api/axiosClient.ts
import axios, { 
  AxiosError, 
  AxiosInstance, 
  InternalAxiosRequestConfig, 
  AxiosResponse 
} from "axios";
import { RefreshResponse } from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

// Mở rộng type mặc định để thêm cờ _retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. REQUEST INTERCEPTOR
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// 2. RESPONSE INTERCEPTOR
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Kiểm tra lỗi 403 (hoặc 401 tùy backend) và chưa retry
    if (error.response && error.response.status === 403 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Gọi API refresh (Type response trả về là RefreshResponse)
        const { data } = await axios.post<RefreshResponse>(
          `${API_BASE_URL}/auth/refresh`, 
          { refreshToken }
        );

        if (data) {
          // Lưu token mới
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);

          // Gắn token mới vào header request cũ
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          }

          // Gọi lại request cũ
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);
        
        // Clear storage và redirect
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userAddress");
        
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;