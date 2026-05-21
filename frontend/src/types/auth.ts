export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  preferredCurrency: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  preferredCurrency: string;
}
