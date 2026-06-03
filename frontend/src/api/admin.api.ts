import api from './axios';

export async function fetchAdminUsers(params: Record<string, string | number>) {
  return api.get('/admin/users', { params }).then((res) => res.data);
}

export async function banAdminUser(id: number, isBanned: boolean) {
  return api.patch(`/admin/users/${id}/ban`, { isBanned }).then((res) => res.data);
}

export async function deleteAdminUser(id: number) {
  return api.delete(`/admin/users/${id}`).then((res) => res.data);
}

export async function fetchAdminTodos(params: Record<string, string | number>) {
  return api.get('/admin/todos', { params }).then((res) => res.data);
}

export async function deleteAdminTodo(id: number) {
  return api.delete(`/admin/todos/${id}`).then((res) => res.data);
}

export async function fetchAdminStats() {
  return api.get('/admin/stats').then((res) => res.data);
}

export async function fetchAdminUserStats() {
  return api.get('/admin/stats/users').then((res) => res.data);
}
