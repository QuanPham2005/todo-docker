import api from './axios';

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = { email: string; password: string };

export async function login(payload: LoginPayload) {
  const response = await api.post('/auth/login', payload);
  return response.data;
}

export async function register(payload: RegisterPayload) {
  const response = await api.post('/auth/register', payload);
  return response.data;
}

export async function logout() {
  const response = await api.post('/auth/logout');
  return response.data;
}
