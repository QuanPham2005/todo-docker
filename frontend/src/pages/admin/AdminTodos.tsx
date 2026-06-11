import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { fetchTodosAndSummary, type AdminTodosQuery } from '../../store/todosSlice';
import { deleteAdminTodo } from '../../api/admin.api';

const todoStatusOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'todo', label: 'Chưa làm' },
  { value: 'in_progress', label: 'Đang làm' },
  { value: 'done', label: 'Hoàn thành' },
  { value: 'overdue', label: 'Quá hạn' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const todoPriorityOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Low', label: 'Thấp' },
  { value: 'Medium', label: 'Trung bình' },
  { value: 'High', label: 'Cao' },
];

const todoPriorityLabelMap: Record<string, string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
};

const todoPriorityColorMap: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  Low: 'success',
  Medium: 'warning',
  High: 'error',
};

// const todoSortOptions = [
//   { value: 'due_date', label: 'Ngày đến hạn' },
//   { value: 'priority', label: 'Ưu tiên' },
//   { value: 'created_at', label: 'Ngày tạo' },
// ];

type AdminTodo = {
  id: number;
  title: string;
  priority: string;
  status: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';
  dueDate: string | null;
  user: { email: string };
  tags: Array<{ name: string }>;
};

export default function AdminTodos() {
  const dispatch = useDispatch();
  const { list: todos, total: todoTotal, isLoading: todoLoading } = useSelector(
    (state: RootState) => state.todos,
  );
  const [error, setError] = useState<string | null>(null);

  const [todoSearch, setTodoSearch] = useState('');
  const [todoStatus, setTodoStatus] = useState('all');
  const [todoPriority, setTodoPriority] = useState('all');
  // const [todoSortBy, setTodoSortBy] = useState('due_date');
  const [todoOrder, setTodoOrder] = useState<'asc' | 'desc'>('asc');
  const [todoPage, setTodoPage] = useState(1);

  const adminTodoQuery: AdminTodosQuery = useMemo(
    () => ({
      page: todoPage,
      limit: 10,
      status: todoStatus,
      priority: todoPriority,
      // sortBy: todoSortBy,
      order: todoOrder.toUpperCase(),
      search: todoSearch,
    }),
    [todoPage, todoStatus, todoPriority, todoOrder, todoSearch],
  );

  useEffect(() => {
    dispatch(fetchTodosAndSummary(adminTodoQuery) as any);
  }, [dispatch, adminTodoQuery]);

  const handleDeleteTodo = async (id: number) => {
    setError(null);
    try {
      await deleteAdminTodo(id);
      dispatch(fetchTodosAndSummary(adminTodoQuery) as any);
    } catch {
      setError('Không thể xoá todo');
    }
  };

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box>
        <Typography variant="h4">Quản lý công việc</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Lọc, tìm kiếm và xoá các công việc trong toàn hệ thống.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 2, borderRadius: 2.5 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              lg: '2fr 1fr 1fr 1fr ',
            },
          }}
        >
          <TextField
            fullWidth
            placeholder="Tìm kiếm todo hoặc người dùng"
            value={todoSearch}
            onChange={(event) => {
              setTodoSearch(event.target.value);
              setTodoPage(1);
            }}
          />
          <FormControl fullWidth size="small">
            <InputLabel id="todo-status-label">Trạng thái</InputLabel>
            <Select
              labelId="todo-status-label"
              value={todoStatus}
              label="Trạng thái"
              onChange={(event: SelectChangeEvent<string>) => {
                setTodoStatus(event.target.value);
                setTodoPage(1);
              }}
            >
              {todoStatusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel id="todo-priority-label">Ưu tiên</InputLabel>
            <Select
              labelId="todo-priority-label"
              value={todoPriority}
              label="Ưu tiên"
              onChange={(event: SelectChangeEvent<string>) => {
                setTodoPriority(event.target.value);
                setTodoPage(1);
              }}
            >
              {todoPriorityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* <FormControl sx={{ minWidth: 140 }}>
            <InputLabel id="todo-sort-label">Sắp xếp</InputLabel>
            <Select
              labelId="todo-sort-label"
              value={todoSortBy}
              label="Sắp xếp"
              onChange={(event: SelectChangeEvent<string>) => setTodoSortBy(event.target.value)}
            >
              {todoSortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl> */}
          <FormControl fullWidth size="small">
            <InputLabel id="todo-order-label">Thứ tự</InputLabel>
            <Select
              labelId="todo-order-label"
              value={todoOrder}
              label="Thứ tự"
              onChange={(event: SelectChangeEvent<'asc' | 'desc'>) =>
                setTodoOrder(event.target.value as 'asc' | 'desc')
              }
            >
              <MenuItem value="asc">Tăng dần</MenuItem>
              <MenuItem value="desc">Giảm dần</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tiêu đề</TableCell>
                <TableCell>Người tạo</TableCell>
                <TableCell>Ưu tiên</TableCell>
                <TableCell>Hạn chót</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Thẻ</TableCell>
                <TableCell align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {todoLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : todos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Không tìm thấy todo.
                  </TableCell>
                </TableRow>
              ) : (
                (todos as AdminTodo[]).map((todo: AdminTodo) => (
                  <TableRow key={todo.id} hover>
                    <TableCell>{todo.title}</TableCell>
                    <TableCell>{todo.user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={todoPriorityLabelMap[todo.priority] ?? todo.priority}
                        color={todoPriorityColorMap[todo.priority] ?? 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'Chưa đặt'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          todo.status === 'done'
                            ? 'Hoàn thành'
                            : todo.status === 'in_progress'
                              ? 'Đang làm'
                              : todo.status === 'todo'
                                ? 'Chưa làm'
                                : todo.status === 'overdue'
                                  ? 'Quá hạn'
                                  : todo.status === 'cancelled'
                                    ? 'Đã hủy'
                                    : 'Không xác định'
                        }
                        color={
                          todo.status === 'done'
                            ? 'success'
                            : todo.status === 'in_progress'
                              ? 'info'
                              : todo.status === 'todo'
                                ? 'default'
                                : todo.status === 'overdue'
                                  ? 'error'
                                  : todo.status === 'cancelled'
                                    ? 'warning'
                                    : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {todo.tags.map((tag: { name: string }) => (
                          <Chip key={tag.name} label={tag.name} size="small" />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="error"
                        variant="contained"
                        onClick={() => handleDeleteTodo(todo.id)}
                      >
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination
          count={Math.ceil(todoTotal / 10)}
          page={todoPage}
          onChange={(_, value) => setTodoPage(value)}
          color="primary"
          shape="rounded"
        />
      </Box>
    </Box>
  );
}
