// services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/* --------------------------------------------
   🔹 1. Tạo axios instance chính cho toàn bộ app
--------------------------------------------- */
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: false
});

/* --------------------------------------------
   🔹 2. Interceptors: thêm token + refresh token
--------------------------------------------- */
apiClient.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { accessToken } = JSON.parse(tokens);
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const tokens = localStorage.getItem('tokens');
        if (!tokens) throw new Error('No refresh token');

        const { refreshToken } = JSON.parse(tokens);
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

        if (response.data.success) {
          const newTokens = {
            accessToken: response.data.accessToken,
            refreshToken
          };
          localStorage.setItem('tokens', JSON.stringify(newTokens));
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

/* --------------------------------------------
   🔹 3. Hỗ trợ E2E chat: thêm header địa chỉ ví
--------------------------------------------- */
export function setUserAddressHeader(address?: string) {
  if (address) apiClient.defaults.headers.common['x-user-address'] = address;
  else delete apiClient.defaults.headers.common['x-user-address'];
}

/* --------------------------------------------
   🔹 4. API nhóm 1: xác thực & người dùng
--------------------------------------------- */
const api = {
  auth: {
    getNonce: async (address: string) => {
      const res = await apiClient.post('/auth/nonce', { address });
      return res.data;
    },
    verify: async (address: string, signature: string, timestamp?: number) => {
      const res = await apiClient.post('/auth/verify', { address, signature, timestamp });
      return res.data;
    },
    refresh: async (refreshToken: string) => {
      const res = await apiClient.post('/auth/refresh', { refreshToken });
      return res.data;
    },
    logout: async (refreshToken: string) => {
      const res = await apiClient.post('/auth/logout', { refreshToken });
      return res.data;
    },
    getMe: async () => {
      const res = await apiClient.get('/auth/me');
      return res.data;
    }
  },

  user: {

    getProfile: async () => {
      const res = await apiClient.get('/user/profile');
      return res.data;
    },
    updateProfile: async (data: any) => {
      const res = await apiClient.put('/user/profile', data);
      return res.data;
    },
    getUsers: async (page = 1, limit = 20, search = '') => {
      const res = await apiClient.get('/users', { params: { page, limit, search } });
      return res.data;
    },
    follow: async (userId: string) => {
      const res = await apiClient.post(`/user/${userId}/follow`);
      return res.data;
    },
    unfollow: async (userId: string) => {
      const res = await apiClient.delete(`/user/${userId}/unfollow`);
      return res.data;
    }
  },

  posts: {
    getFeed: async (page = 1, limit = 20) => {
      const res = await apiClient.get('/posts/feed', { params: { page, limit } });
      return res.data;
    },
    create: async (data: any) => {
      const res = await apiClient.post('/posts', data);
      return res.data;
    },
    like: async (postId: string) => {
      const res = await apiClient.post(`/posts/${postId}/like`);
      return res.data;
    },
    comment: async (postId: string, desc: string) => {
      const res = await apiClient.post(`/posts/${postId}/comment`, { desc });
      return res.data;
    }
  }
};

export const Users = {
  updateMe: (messagingPublicKey: string) =>
    apiClient.patch('/users/me', { messagingPublicKey }).then((r) => r.data)
};

export const Conversations = {
  createDM: (peerAddress: string) =>
    apiClient.post('/messages/conversations/dm', { peerAddress }).then((r) => r.data),
  list: (cursor?: string, limit = 20) =>
    apiClient.get('/messages/conversations', { params: { cursor, limit } }).then((r) => r.data)
};

export const ChatMessages = {
  list: (conversationId: string, cursor?: string, limit = 50) =>
    apiClient
      .get('/messages/messages', { params: { conversationId, cursor, limit } })
      .then((r) => r.data),
  uploadEncrypted: (b64: string, filename = 'msg.bin') =>
    apiClient.post('/messages/uploadEncrypted', { b64, filename }).then((r) => r.data),
  fetchEncrypted: (cid: string) =>
    apiClient.get('/messages/fetchEncrypted', { params: { cid } }).then((r) => r.data),
  create: (payload: {
    conversationId: string;
    cid: string;
    nonce: string;
    contentType?: string;
    bytes?: number;
    hash?: string;
    preview?: string;
  }) => apiClient.post('/messages/messages', payload).then((r) => r.data),
  delivered: (id: string) => apiClient.post(`/messages/messages/${id}/delivered`),
  read: (id: string) => apiClient.post(`/messages/messages/${id}/read`)
};

/* --------------------------------------------
   🔹 6. Export
--------------------------------------------- */
export default api;
