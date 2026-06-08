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

// Start a todo: transitions from 'todo' to 'in_progress'
export async function startTodo(id: number) {
  return api.patch(`/todos/${id}/start`).then((res) => res.data);
}

// Complete a todo: transitions from 'todo' or 'in_progress' to 'done'
export async function completeTodo(id: number) {
  return api.patch(`/todos/${id}/complete`).then((res) => res.data);
}

// Cancel a todo with required reason: transitions to 'cancelled'
export async function cancelTodo(id: number, reason: string) {
  return api.patch(`/todos/${id}/cancel`, { reason }).then((res) => res.data);
}

export async function fetchTodoStats() {
  return api.get('/todos/stats').then((res) => res.data);
}

export async function deleteTodo(id: number) {
  return api.delete(`/todos/${id}`).then((res) => res.data);
}
