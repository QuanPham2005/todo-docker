import api from './axios';

export async function fetchTodos(params: Record<string, string | number>) {
  return api.get('/todos', { params }).then((res) => res.data);
}

export async function createTodo(body: Record<string, unknown>) {
  return api.post('/todos', body).then((res) => res.data);
}

export async function updateTodo(id: number, body: Record<string, unknown>) {
  return api.patch(`/todos/${id}`, body).then((res) => res.data);
}

export async function toggleTodo(id: number) {
  return api.patch(`/todos/${id}/toggle`).then((res) => res.data);
}

export async function deleteTodo(id: number) {
  return api.delete(`/todos/${id}`).then((res) => res.data);
}
