export type RolUsuario = 'ADMIN' | 'STAFF';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  rol: RolUsuario;
}

export interface AuthSession {
  token: string;
  username: string;
  rol: RolUsuario;
}
