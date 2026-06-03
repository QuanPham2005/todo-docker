import create from 'zustand';

const ACCESS_TOKEN_KEY = 'todo_access_token';

export type UserPayload = {
  id?: number;
  email?: string;
  role?: 'USER' | 'ADMIN';
};

function decodeJwt(token: string | null): UserPayload | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const parsed = JSON.parse(atob(payload));
    return {
      id: parsed.sub ? Number(parsed.sub) : undefined,
      email: parsed.email,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function clearAuth() {
  setAccessToken(null);
}

export interface AuthState {
  accessToken: string | null;
  user: UserPayload | null;
  setSession: (token: string) => void;
  clearSession: () => void;
}

const initialToken = getAccessToken();

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialToken,
  user: decodeJwt(initialToken),
  setSession: (token: string) => {
    setAccessToken(token);
    set({ accessToken: token, user: decodeJwt(token) });
  },
  clearSession: () => {
    clearAuth();
    set({ accessToken: null, user: null });
  },
}));
