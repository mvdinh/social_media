import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request interceptor - Add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { accessToken } = JSON.parse(tokens);
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = localStorage.getItem('tokens');
        if (!tokens) {
          throw new Error('No refresh token');
        }

        const { refreshToken } = JSON.parse(tokens);
        
        // Call refresh token endpoint
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken
        });

        if (response.data.success) {
          const newTokens = {
            accessToken: response.data.accessToken,
            refreshToken
          };
          
          // Save new tokens
          localStorage.setItem('tokens', JSON.stringify(newTokens));
          
          // Update authorization header
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          
          // Retry original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Methods
const api = {
  // Auth endpoints
  auth: {
    getNonce: async (address) => {
      const response = await apiClient.post('/auth/nonce', { address });
      return response.data;
    },

    verify: async (address, signature, timestamp) => {
      const response = await apiClient.post('/auth/verify', {
        address,
        signature,
        timestamp
      });
      return response.data;
    },

    refresh: async (refreshToken) => {
      const response = await apiClient.post('/auth/refresh', { refreshToken });
      return response.data;
    },

    logout: async (refreshToken) => {
      const response = await apiClient.post('/auth/logout', { refreshToken });
      return response.data;
    },

    logoutAll: async () => {
      const response = await apiClient.post('/auth/logout-all');
      return response.data;
    },

    getMe: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    }
  },

  // User endpoints
  user: {
    getProfile: async () => {
      const response = await apiClient.get('/user/profile');
      return response.data;
    },

    updateProfile: async (data) => {
      const response = await apiClient.put('/user/profile', data);
      return response.data;
    },

    getUser: async (username) => {
      const response = await apiClient.get(`/user/${username}`);
      return response.data;
    },

    getUsers: async (page = 1, limit = 20, search = '') => {
      const response = await apiClient.get('/users', {
        params: { page, limit, search }
      });
      return response.data;
    },

    getFollowers: async (userId, page = 1, limit = 20) => {
      const response = await apiClient.get(`/user/${userId}/followers`, {
        params: { page, limit }
      });
      return response.data;
    },

    getFollowing: async (userId, page = 1, limit = 20) => {
      const response = await apiClient.get(`/user/${userId}/following`, {
        params: { page, limit }
      });
      return response.data;
    },

    follow: async (userId) => {
      const response = await apiClient.post(`/user/${userId}/follow`);
      return response.data;
    },

    unfollow: async (userId) => {
      const response = await apiClient.delete(`/user/${userId}/unfollow`);
      return response.data;
    },

    getSuggestions: async (limit = 10) => {
      const response = await apiClient.get('/user/search/suggestions', {
        params: { limit }
      });
      return response.data;
    }
  },

  // Post endpoints (for future use)
  posts: {
    create: async (data) => {
      const response = await apiClient.post('/posts', data);
      return response.data;
    },

    getFeed: async (page = 1, limit = 20) => {
      const response = await apiClient.get('/posts/feed', {
        params: { page, limit }
      });
      return response.data;
    },

    getPost: async (postId) => {
      const response = await apiClient.get(`/posts/${postId}`);
      return response.data;
    },

    getUserPosts: async (userId, page = 1, limit = 20) => {
      const response = await apiClient.get(`/posts/user/${userId}`, {
        params: { page, limit }
      });
      return response.data;
    },

    update: async (postId, data) => {
      const response = await apiClient.put(`/posts/${postId}`, data);
      return response.data;
    },

    delete: async (postId) => {
      const response = await apiClient.delete(`/posts/${postId}`);
      return response.data;
    },

    like: async (postId) => {
      const response = await apiClient.post(`/posts/${postId}/like`);
      return response.data;
    },

    unlike: async (postId) => {
      const response = await apiClient.delete(`/posts/${postId}/unlike`);
      return response.data;
    },

    comment: async (postId, desc) => {
      const response = await apiClient.post(`/posts/${postId}/comment`, { desc });
      return response.data;
    },

    getComments: async (postId) => {
      const response = await apiClient.get(`/posts/${postId}/comments`);
      return response.data;
    },

    deleteComment: async (postId, commentId) => {
      const response = await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
      return response.data;
    }
  }
};

export default api;