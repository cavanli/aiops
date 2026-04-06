export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
