// Unified Authentication Response Schema
// All auth endpoints must return this exact structure

export interface AuthSuccessResponse<T> {
  success: true;
  data: T;
}

export interface AuthErrorResponse {
  success: false;
  error: string;
}

export interface AuthUserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface RegisterResponse extends AuthSuccessResponse<{
  user: AuthUserData;
  token: string;
  refreshToken: string;
}> {}

export interface LoginResponse extends AuthSuccessResponse<{
  user: AuthUserData;
  token: string;
  refreshToken: string;
}> {}

export interface RefreshResponse extends AuthSuccessResponse<{
  user: AuthUserData;
  token: string;
  refreshToken: string;
}> {}

export interface MeResponse extends AuthSuccessResponse<{
  user: AuthUserData;
}> {}

export type AuthResponseType = 
  | RegisterResponse 
  | LoginResponse 
  | RefreshResponse 
  | MeResponse
  | AuthErrorResponse;
