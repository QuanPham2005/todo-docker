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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Pagination from '@mui/material/Pagination';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';
import UndoIcon from '@mui/icons-material/Undo';
import SearchIcon from '@mui/icons-material/Search';
import { fetchTodos, createTodo, updateTodo, toggleTodo, deleteTodo } from '../api/todos.api';

const priorities = ['Low', 'Medium', 'High'] as const;

type TodoItem = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  completed: boolean;
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
  const [status, setStatus] = useState('all');
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);

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
    loadTodos();
  }, [page, status, priority, sortBy, order, search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingTodo(null);
    setIsEditOpen(false);
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
    setIsEditOpen(true);
  };

  const handleToggle = async (todo: TodoItem) => {
    setError(null);
    try {
      const updated = await toggleTodo(todo.id);
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setError('Không thể cập nhật trạng thái todo.');
    }
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

  const stats = useMemo(() => {
    const today = new Date();
    const overdueCount = todos.filter((todo) => {
      const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
      return !todo.completed && dueDate !== null && dueDate < today;
    }).length;
    const completedCount = todos.filter((todo) => todo.completed).length;
    const pendingCount = todos.length - completedCount;
    return { overdueCount, completedCount, pendingCount };
  }, [todos]);

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h4">Danh sách Todo</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' } }}>
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
                {editingTodo ? (
                  <Button onClick={resetForm}>Hủy</Button>
                ) : null}
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

        <Box>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
              <Box sx={{ minWidth: 220, flex: '1 1 220px' }}>
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
              </Box>
              <Box sx={{ minWidth: 180, flex: '1 1 180px' }}>
                <FormControl fullWidth>
                  <InputLabel id="status-filter-label">Trạng thái</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    label="Trạng thái"
                    value={status}
                    onChange={(event: SelectChangeEvent<string>) => {
                      setStatus(event.target.value);
                      setPage(1);
                    }}
                  >
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="pending">Chưa hoàn thành</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ minWidth: 180, flex: '1 1 180px' }}>
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
              </Box>
              <Box sx={{ minWidth: 180, flex: '1 1 180px' }}>
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
              </Box>
              <Box sx={{ minWidth: 180, flex: '1 1 180px' }}>
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
            </Stack>
          </Paper>

          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tiêu đề</TableCell>
                    <TableCell>Ưu tiên</TableCell>
                    <TableCell>Ngày đến hạn</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thẻ</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : todos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Không có todo nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    todos.map((todo) => (
                      <TableRow key={todo.id} hover>
                        <TableCell>
                          <Typography fontWeight={600}>{todo.title}</Typography>
                          {todo.description ? (
                            <Typography variant="body2" color="text.secondary">
                              {todo.description}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>{todo.priority}</TableCell>
                        <TableCell>
                          {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'Chưa đặt'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={todo.completed ? 'Hoàn thành' : 'Chưa hoàn thành'}
                            color={todo.completed ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {todo.tags.map((tag) => (
                              <Chip key={tag.name} label={tag.name} size="small" />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton size="small" onClick={() => handleToggle(todo)}>
                              {todo.completed ? <UndoIcon /> : <DoneIcon />}
                            </IconButton>
                            <IconButton size="small" onClick={() => handleEdit(todo)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(todo.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
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
            <Typography variant="subtitle1">Tóm tắt</Typography>
            <Typography variant="body2">Todo chưa hoàn thành: {stats.pendingCount}</Typography>
            <Typography variant="body2">Todo hoàn thành: {stats.completedCount}</Typography>
            <Typography variant="body2">Todo quá hạn: {stats.overdueCount}</Typography>
          </Paper>
        </Box>
      </Box>

      <Dialog open={isEditOpen} onClose={resetForm} fullWidth maxWidth="sm">
        <DialogTitle>{editingTodo ? 'Chỉnh sửa Todo' : 'Tạo Todo mới'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
              <InputLabel id="dialog-priority-label">Độ ưu tiên</InputLabel>
              <Select
                labelId="dialog-priority-label"
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
        <DialogActions>
          <Button onClick={resetForm}>Đóng</Button>
          <Button onClick={handleSave} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={18} /> : editingTodo ? 'Cập nhật' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
