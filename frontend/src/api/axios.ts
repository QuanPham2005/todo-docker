import axios from 'axios';
import { getAccessToken, setAccessToken, clearAuth } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register')
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${API_BASE}/auth/refresh`,
          null,
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          },
        );

        const accessToken = refreshResponse.data?.access_token;
        if (accessToken) {
          setAccessToken(accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        clearAuth();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
