import { useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
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
import Pagination from '@mui/material/Pagination';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchIcon from '@mui/icons-material/Search';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TodoCard, { type TodoItem } from '../components/todos/TodoCard';
import {
  fetchTodos,
  fetchTodoStats,
  createTodo,
  updateTodo,
  startTodo,
  completeTodo,
  cancelTodo,
  deleteTodo,
} from '../api/todos.api';

const priorities = ['Low', 'Medium', 'High'] as const;

type TodoStatus = 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';

// Board column definitions (Trello-style)
const columns: Array<{ key: TodoStatus; label: string; color: string }> = [
  { key: 'todo', label: 'Cần làm', color: '#5e6c84' },
  { key: 'in_progress', label: 'Đang làm', color: '#0c66e4' },
  { key: 'done', label: 'Hoàn thành', color: '#22a06b' },
  { key: 'overdue', label: 'Quá hạn', color: '#c9372c' },
  { key: 'cancelled', label: 'Đã hủy', color: '#e2780f' },
];

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
  const [status, setStatus] = useState<'all' | TodoStatus>('all');
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
  const [formOpen, setFormOpen] = useState(false);
  const [cancelingTodoId, setCancelingTodoId] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [stats, setStats] = useState({
    todo: 0,
    in_progress: 0,
    done: 0,
    overdue: 0,
    cancelled: 0,
  });

  const loadStats = () => {
    fetchTodoStats()
      .then(setStats)
      .catch(() => {
        /* stats optional on error */
      });
  };

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
        console.log('Todos fetched:', data.items);
        setTodos(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((err) => {
        console.error('Error fetching todos:', err);
        setError('Không thể tải danh sách todo. Vui lòng thử lại.');
      })
      .finally(() => setLoading(false));
    loadStats();
  };

  useEffect(() => {
    loadTodos();
  }, [page, status, priority, sortBy, order, search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingTodo(null);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
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
      setFormOpen(false);
      loadStats();
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
    setFormOpen(true);
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
    setError(null);
    setCancelingTodoId(todoId);
    setCancellationReason('');
  };

  const handleCancelConfirm = async () => {
    if (cancelingTodoId === null) return;

    if (cancellationReason.trim().length < 10) {
      setError('Lý do hủy phải có ít nhất 10 ký tự');
      return;
    }

    setError(null);
    try {
      await cancelTodo(cancelingTodoId, cancellationReason);
      // Refresh the todo list and stats after successful cancellation
      loadTodos();
      setCancelingTodoId(null);
      setCancellationReason('');
    } catch (error) {
      setError('Không thể hủy todo. Vui lòng thử lại.');
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
      loadStats();
    } catch {
      setError('Không thể xóa todo.');
    }
  };

  // Group the fetched todos into status columns for the board view
  const grouped = useMemo(() => {
    const map: Record<TodoStatus, TodoItem[]> = {
      todo: [],
      in_progress: [],
      done: [],
      overdue: [],
      cancelled: [],
    };
    todos.forEach((todo) => {
      if (map[todo.status]) map[todo.status].push(todo);
    });
    return map;
  }, [todos]);

  const visibleColumns = status === 'all' ? columns : columns.filter((c) => c.key === status);
  const statCount: Record<TodoStatus, number> = {
    todo: stats.todo,
    in_progress: stats.in_progress,
    done: stats.done,
    overdue: stats.overdue,
    cancelled: stats.cancelled,
  };

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4">Bảng công việc</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tổng {total} công việc · Kéo theo trạng thái để theo dõi tiến độ.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          Thêm công việc
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {/* Filter toolbar */}
      <Paper sx={{ p: 2, borderRadius: 2.5 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              lg: '2fr 1fr 1fr 1fr 1fr',
            },
          }}
        >
          <TextField
            fullWidth
            placeholder="Tìm kiếm công việc..."
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
          <FormControl fullWidth size="small">
            <InputLabel id="status-filter-label">Trạng thái</InputLabel>
            <Select
              labelId="status-filter-label"
              label="Trạng thái"
              value={status}
              onChange={(event: SelectChangeEvent<string>) => {
                setStatus(event.target.value as 'all' | TodoStatus);
                setPage(1);
              }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="todo">Cần làm</MenuItem>
              <MenuItem value="in_progress">Đang làm</MenuItem>
              <MenuItem value="done">Hoàn thành</MenuItem>
              <MenuItem value="overdue">Quá hạn</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
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
          <FormControl fullWidth size="small">
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
          <FormControl fullWidth size="small">
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

      {/* Board */}
      {loading ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 1,
            alignItems: 'flex-start',
          }}
        >
          {visibleColumns.map((col) => {
            const items = grouped[col.key];
            return (
              <Box
                key={col.key}
                sx={{
                  flex: status === 'all' ? '0 0 300px' : '1 1 100%',
                  minWidth: status === 'all' ? 300 : undefined,
                  maxWidth: status === 'all' ? 320 : undefined,
                  bgcolor: '#ebecf0',
                  borderRadius: 2.5,
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 320px)',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1,
                    py: 1,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: col.color }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {col.label}
                    </Typography>
                  </Stack>
                  <Chip
                    label={statCount[col.key]}
                    size="small"
                    sx={{ bgcolor: 'rgba(9,30,66,0.08)', color: 'text.secondary', fontWeight: 700 }}
                  />
                </Box>

                <Stack
                  spacing={1}
                  sx={{
                    overflowY: 'auto',
                    px: 0.5,
                    pb: 0.5,
                    flex: 1,
                  }}
                >
                  {items.length === 0 ? (
                    <Box
                      sx={{
                        py: 3,
                        textAlign: 'center',
                        color: 'text.disabled',
                        border: '2px dashed #dfe1e6',
                        borderRadius: 2,
                        m: 0.5,
                      }}
                    >
                      <Typography variant="caption">Không có công việc</Typography>
                    </Box>
                  ) : (
                    items.map((todo) => (
                      <TodoCard
                        key={todo.id}
                        todo={todo}
                        onEdit={handleEdit}
                        onStart={handleStart}
                        onComplete={handleComplete}
                        onCancel={handleCancelClick}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Trang {page} · Hiển thị {todos.length} / {total} công việc
        </Typography>
        <Pagination
          count={Math.max(Math.ceil(total / limit), 1)}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          shape="rounded"
        />
      </Box>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onClose={closeForm} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingTodo ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Tiêu đề"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              fullWidth
              autoFocus
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
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </LocalizationProvider>
            <FormControl fullWidth size="small">
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeForm}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {editingTodo ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={cancelingTodoId !== null} onClose={handleCancelCancel} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Hủy công việc</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
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
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCancelCancel}>Hủy bỏ</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelConfirm}
            disabled={cancellationReason.trim().length < 10}
          >
            Xác nhận hủy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
