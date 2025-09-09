export interface LoginPayload {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  status: string;
  data: LoginPayload;
  message: string;
}
