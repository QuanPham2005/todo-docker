import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';
import type { RootState, AppDispatch } from './index';

export type TodoStatusSummary = {
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
  cancelled: number;
};

export type AdminTodosQuery = {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  order?: string;
};

type FetchPayload = {
  items: unknown[];
  total: number;
  page: number;
  limit: number;
  summary: TodoStatusSummary;
};

export const fetchTodosAndSummary = createAsyncThunk<
  FetchPayload,
  AdminTodosQuery | undefined
>('todos/fetchAll', async (query = {}) => {
  const params: Record<string, string | number> = {
    page: query.page ?? 1,
    limit: query.limit ?? 10,
    sortBy: query.sortBy ?? 'due_date',
    order: query.order ?? 'ASC',
    status: query.status ?? 'all',
  };

  if (query.search?.trim()) {
    params.search = query.search.trim();
  }
  if (query.priority && query.priority !== 'all') {
    params.priority = query.priority;
  }

  const [todosRes, summaryRes] = await Promise.all([
    api.get('/admin/todos', { params }),
    api.get('/admin/stats'),
  ]);

  return {
    items: todosRes.data.items ?? [],
    total: todosRes.data.total ?? 0,
    page: todosRes.data.page ?? params.page,
    limit: todosRes.data.limit ?? params.limit,
    summary: summaryRes.data,
  };
});

export const performTodoAction = createAsyncThunk<
  void,
  { id: number; action: 'start' | 'complete' | 'cancel'; reason?: string },
  { dispatch: AppDispatch; state: RootState }
>(
  'todos/performAction',
  async ({ id, action, reason }, { dispatch, getState }) => {
    const body = action === 'cancel' ? { reason } : undefined;
    await api.patch(`/todos/${id}/${action}`, body);
    const { page, limit } = getState().todos;
    await dispatch(fetchTodosAndSummary({ page, limit }));
  },
);

const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    list: [] as unknown[],
    total: 0,
    page: 1,
    limit: 10,
    summary: {
      todo: 0,
      in_progress: 0,
      done: 0,
      overdue: 0,
      cancelled: 0,
    } as TodoStatusSummary,
    isLoading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodosAndSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodosAndSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.summary = action.payload.summary;
      })
      .addCase(fetchTodosAndSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Đã có lỗi xảy ra';
      });
  },
});

export default todosSlice.reducer;
