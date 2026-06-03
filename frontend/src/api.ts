const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const ACCESS_TOKEN_KEY = 'todo_access_token';

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

async function refreshToken(): Promise<boolean> {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  setAccessToken(data.access_token);
  return true;
}

export async function request(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    auth?: boolean;
    retry?: boolean;
  } = {},
) {
  const { method = 'GET', body, auth = true, retry = false } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (response.status === 401 && auth && !retry) {
    const refreshed = await refreshToken();
    if (refreshed) {
      return request(path, { method, body, auth, retry: true });
    }
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? JSON.stringify(payload.error)
        : String(payload);
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return payload;
}

export async function login(email: string, password: string) {
  return request('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export async function register(email: string, password: string) {
  return request('/auth/register', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export async function logout() {
  await request('/auth/logout', { method: 'POST' });
  setAccessToken(null);
}

export async function fetchTodos(params: Record<string, string | number>) {
  const search = new URLSearchParams(params as Record<string, string>);
  return request(`/todos?${search.toString()}`);
}

export async function fetchAdminUsers(params: Record<string, string | number>) {
  const search = new URLSearchParams(params as Record<string, string>);
  return request(`/admin/users?${search.toString()}`);
}

export async function banAdminUser(id: number, isBanned: boolean) {
  return request(`/admin/users/${id}/ban`, {
    method: 'PATCH',
    body: { isBanned },
  });
}

export async function deleteAdminUser(id: number) {
  return request(`/admin/users/${id}`, { method: 'DELETE' });
}

export async function fetchAdminTodos(params: Record<string, string | number>) {
  const search = new URLSearchParams(params as Record<string, string>);
  return request(`/admin/todos?${search.toString()}`);
}

export async function deleteAdminTodo(id: number) {
  return request(`/admin/todos/${id}`, { method: 'DELETE' });
}

export async function fetchAdminStats() {
  return request('/admin/stats');
}

export async function fetchAdminUserStats() {
  return request('/admin/stats/users');
}
