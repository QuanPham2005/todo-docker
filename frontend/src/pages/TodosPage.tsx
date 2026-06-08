import { useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Pagination from '@mui/material/Pagination';
import Alert from '@mui/material/Alert';
import CardActions from '@mui/material/CardActions';
import CircularProgress from '@mui/material/CircularProgress';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';
import UndoIcon from '@mui/icons-material/Undo';
import SearchIcon from '@mui/icons-material/Search';
import { fetchTodos, createTodo, updateTodo, startTodo, completeTodo, cancelTodo, deleteTodo } from '../api/todos.api';

const priorities = ['Low', 'Medium', 'High'] as const;

// Priority colors for visual distinction
const priorityColors = {
  Low: '#4caf50',    // Green
  Medium: '#ff9800', // Orange
  High: '#f44336',   // Red
} as const;

// Status colors for visual distinction (MUI color variants)
const statusColorMap: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  todo: 'default',       // Gray
  in_progress: 'info',   // Blue
  done: 'success',       // Green
  overdue: 'error',      // Red
  cancelled: 'warning',  // Orange
};

type TodoItem = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  status: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';
  cancellationReason?: string | null;
  tags: Array<{ name: string }>;
};

type TodoForm = {
  title: string;
  description: string;
  priority: string;
  tags: string;
  dueDate: Dayjs | null;
};

const initialForm: TodoForm = {
  title: '',
  description: '',
  priority: 'Low',
  tags: '',
  dueDate: dayjs(),
};

export default function TodosPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled'>('all');
  const [priority, setPriority] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TodoForm>(initialForm);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [cancelingTodoId, setCancelingTodoId] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const loadTodos = () => {
    setLoading(true);
    setError(null);
    const params: Record<string, string | number> = {
      page,
      limit,
      status,
      sortBy,
      order,
    };
    if (search.trim()) {
      params.search = search.trim();
    }
    if (priority !== 'all') {
      params.priority = priority;
    }

    fetchTodos(params)
      .then((data) => {
        setTodos(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setError('Không thể tải danh sách todo. Vui lòng thử lại.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTodos(); // Refresh both the todo list and stats after action
  }, [page, status, priority, sortBy, order, search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingTodo(null);
  };

  const parseTags = (raw: string) =>
    raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Tiêu đề là bắt buộc.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      dueDate: form.dueDate ? form.dueDate.toISOString() : null,
      tags: parseTags(form.tags),
    };

    try {
      const saved = editingTodo
        ? await updateTodo(editingTodo.id, payload)
        : await createTodo(payload);

      if (editingTodo) {
        setTodos((current) => current.map((todo) => (todo.id === saved.id ? saved : todo)));
      } else {
        setTodos((current) => [saved, ...current]);
        setTotal((prev) => prev + 1);
      }
      resetForm();
    } catch {
      setError('Không thể lưu todo. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (todo: TodoItem) => {
    setEditingTodo(todo);
    setForm({
      title: todo.title,
      description: todo.description ?? '',
      priority: todo.priority,
      tags: todo.tags.map((tag) => tag.name).join(', '),
      dueDate: todo.dueDate ? dayjs(todo.dueDate) : dayjs(),
    });
  };

  // Starts a todo: transitions from 'todo' to 'in_progress'
  // After any status change, both summary and todo list must be
  // refreshed together to prevent display inconsistency.
  const handleStart = async (todo: TodoItem) => {
    setError(null);
    try {
      await startTodo(todo.id);
      // Refresh both the todo list and stats after action
      loadTodos(); // Refresh both the todo list and stats after action
    } catch {
      setError('Không thể bắt đầu todo.');
    }
  };

  // Completes a todo: transitions from 'todo' or 'in_progress' to 'done'
  // After any status change, both summary and todo list must be
  // refreshed together to prevent display inconsistency.
  const handleComplete = async (todo: TodoItem) => {
    setError(null);
    try {
      await completeTodo(todo.id);
      // Refresh both the todo list and stats after action
      loadTodos(); // Refresh both the todo list and stats after action
    } catch {
      setError('Không thể hoàn thành todo.');
    }
  };

  // Cancels a todo with required reason: transitions to 'cancelled'
  // After any status change, both summary and todo list must be
  // refreshed together to prevent display inconsistency.
  const handleCancelClick = (todoId: number) => {
    setCancelingTodoId(todoId);
    setCancellationReason('');
  };

  const handleCancelConfirm = async () => {
    if (!cancelingTodoId) return;

    if (cancellationReason.trim().length < 10) {
      setError('Lý do hủy phải có ít nhất 10 ký tự');
      return;
    }

    setError(null);
    try {
      await cancelTodo(cancelingTodoId, cancellationReason);
      // Refresh both the todo list and stats after action
      loadTodos();
      setCancelingTodoId(null);
      setCancellationReason('');
      loadTodos();
    } catch {
      setError('Không thể hủy todo.');
    }
  };

  const handleCancelCancel = () => {
    setCancelingTodoId(null);
    setCancellationReason('');
  };

  const handleDelete = async (todoId: number) => {
    setError(null);
    try {
      await deleteTodo(todoId);
      setTodos((current) => current.filter((item) => item.id !== todoId));
      setTotal((prev) => Math.max(prev - 1, 0));
    } catch {
      setError('Không thể xóa todo.');
    }
  };

  const normalizeDate = (date: Date | null) => {
    if (!date) return null;
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  };

  const stats = useMemo(() => {
    return {
      todoCount: todos.filter((todo) => todo.status === 'todo').length,
      inProgressCount: todos.filter((todo) => todo.status === 'in_progress').length,
      doneCount: todos.filter((todo) => todo.status === 'done').length,
      overdueCount: todos.filter((todo) => todo.status === 'overdue').length,
      cancelledCount: todos.filter((todo) => todo.status === 'cancelled').length,
    };
  }, [todos]);

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h4">Danh sách Todo</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Thêm / Chỉnh sửa Todo
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Tiêu đề"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Mô tả"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            fullWidth
            multiline
            minRows={3}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Ngày đến hạn"
              value={form.dueDate}
              onChange={(newValue) => setForm((prev) => ({ ...prev, dueDate: newValue }))}
              minDate={dayjs()}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
          <FormControl fullWidth>
            <InputLabel id="priority-label">Độ ưu tiên</InputLabel>
            <Select
              labelId="priority-label"
              label="Độ ưu tiên"
              value={form.priority}
              onChange={(event: SelectChangeEvent<string>) =>
                setForm((prev) => ({ ...prev, priority: event.target.value }))
              }
            >
              {priorities.map((priorityOption) => (
                <MenuItem key={priorityOption} value={priorityOption}>
                  {priorityOption}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Thẻ (phân tách bằng dấu phẩy)"
            value={form.tags}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            fullWidth
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {editingTodo ? <Button onClick={resetForm}>Hủy</Button> : null}
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} /> : undefined}
            >
              {editingTodo ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: 'grid', gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Bộ lọc Todo
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <TextField
              fullWidth
              label="Tìm kiếm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Trạng thái</InputLabel>
              <Select
                labelId="status-filter-label"
                label="Trạng thái"
                value={status}
                onChange={(event: SelectChangeEvent<string>) => {
                  setStatus(event.target.value as 'all' | 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled');
                  setPage(1);
                }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="todo">Todo</MenuItem>
                <MenuItem value="in_progress">Đang làm</MenuItem>
                <MenuItem value="done">Hoàn thành</MenuItem>
                <MenuItem value="overdue">Quá hạn</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="priority-filter-label">Ưu tiên</InputLabel>
              <Select
                labelId="priority-filter-label"
                label="Ưu tiên"
                value={priority}
                onChange={(event: SelectChangeEvent<string>) => {
                  setPriority(event.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {priorities.map((priorityOption) => (
                  <MenuItem key={priorityOption} value={priorityOption}>
                    {priorityOption}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="sort-label">Sắp xếp</InputLabel>
              <Select
                labelId="sort-label"
                label="Sắp xếp"
                value={sortBy}
                onChange={(event: SelectChangeEvent<string>) => setSortBy(event.target.value)}
              >
                <MenuItem value="due_date">Ngày đến hạn</MenuItem>
                <MenuItem value="priority">Ưu tiên</MenuItem>
                <MenuItem value="created_at">Mới nhất</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="order-label">Thứ tự</InputLabel>
              <Select
                labelId="order-label"
                label="Thứ tự"
                value={order}
                onChange={(event: SelectChangeEvent<'asc' | 'desc'>) =>
                  setOrder(event.target.value as 'asc' | 'desc')
                }
              >
                <MenuItem value="asc">Tăng dần</MenuItem>
                <MenuItem value="desc">Giảm dần</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        <Paper>
          {loading ? (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : todos.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Không có todo nào.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bắt đầu tạo todo mới để quản lý công việc của bạn.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              {todos.map((todo) => (
                <Paper key={todo.id} sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack>
                        <Typography variant="h6" fontWeight={700}>
                          {todo.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: priorityColors[todo.priority as keyof typeof priorityColors],
                              opacity: 0.8
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {todo.priority} • {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'Chưa đặt ngày'}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip
                        label={
                          todo.status === 'todo' ? 'Todo'
                          : todo.status === 'in_progress' ? 'Đang làm'
                          : todo.status === 'done' ? 'Hoàn thành'
                          : todo.status === 'overdue' ? 'Quá hạn'
                          : 'Đã hủy'
                        }
                        color={statusColorMap[todo.status]}
                        size="small"
                      />
                    </Stack>

                    {todo.description ? (
                      <Typography variant="body2" color="text.secondary">
                        {todo.description}
                      </Typography>
                    ) : null}

                    {todo.cancellationReason && todo.status === 'cancelled' ? (
                      <Typography variant="caption" color="error" sx={{ fontStyle: 'italic' }}>
                        Đã hủy: {todo.cancellationReason}
                      </Typography>
                    ) : null}

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {todo.tags.map((tag) => (
                        <Chip key={tag.name} label={tag.name} size="small" />
                      ))}
                    </Stack>

                    <CardActions sx={{ justifyContent: 'flex-end', px: 0, py: 1 }}>
                      {/* Show action buttons based on current status */}
                      {todo.status === 'todo' && (
                        <>
                          <Button size="small" onClick={() => handleStart(todo)} startIcon={<EditIcon />}>
                            Bắt đầu
                          </Button>
                          <Button size="small" variant="outlined" onClick={() => handleComplete(todo)} startIcon={<DoneIcon />}>
                            Hoàn thành
                          </Button>
                          <Button size="small" color="warning" onClick={() => handleCancelClick(todo.id)}>
                            Hủy
                          </Button>
                        </>
                      )}
                      {todo.status === 'in_progress' && (
                        <>
                          <Button size="small" variant="outlined" onClick={() => handleComplete(todo)} startIcon={<DoneIcon />}>
                            Hoàn thành
                          </Button>
                          <Button size="small" color="warning" onClick={() => handleCancelClick(todo.id)}>
                            Hủy
                          </Button>
                        </>
                      )}
                      {todo.status === 'overdue' && (
                        <Button size="small" color="warning" onClick={() => handleCancelClick(todo.id)}>
                          Hủy
                        </Button>
                      )}
                      {/* No action buttons for done or cancelled */}
                      <Button size="small" color="error" onClick={() => handleDelete(todo.id)} startIcon={<DeleteIcon />}>
                        Xóa
                      </Button>
                    </CardActions>
                  </Stack>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2">Tổng: {total} todo</Typography>
          <Pagination
            count={Math.ceil(total / limit)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
          />
        </Box>

        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1">Tóm tắt (5 trạng thái)</Typography>
          <Typography variant="body2">Todo: {stats.todoCount}</Typography>
          <Typography variant="body2">Đang làm: {stats.inProgressCount}</Typography>
          <Typography variant="body2">Hoàn thành: {stats.doneCount}</Typography>
          <Typography variant="body2">Quá hạn: {stats.overdueCount}</Typography>
          <Typography variant="body2">Đã hủy: {stats.cancelledCount}</Typography>
        </Paper>

        {/* Cancel Modal */}
        {cancelingTodoId !== null && (
          <Paper sx={{ p: 3, mt: 2, border: '1px solid #ddd', backgroundColor: '#fafafa' }}>
            <Typography variant="h6" gutterBottom>Hủy Todo</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Nhập lý do hủy (tối thiểu 10 ký tự):
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Lý do hủy..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              error={cancellationReason.length > 0 && cancellationReason.length < 10}
              helperText={
                cancellationReason.length > 0 && cancellationReason.length < 10
                  ? `Cần ${10 - cancellationReason.length} ký tự nữa`
                  : ''
              }
            />
            <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
              <Button onClick={handleCancelCancel}>Hủy bỏ</Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleCancelConfirm}
                disabled={cancellationReason.trim().length < 10}
              >
                Xác nhận hủy
              </Button>
            </Stack>
          </Paper>
        )}
      </Box>

    </Box>
  );
}
