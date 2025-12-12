// src/types/auth.ts

export interface User {
  id: string;
  address: string;
  username?: string;
  profilePicture?: string;
}

export interface AuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface NonceResponse {
  nonce: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  error: string;
}