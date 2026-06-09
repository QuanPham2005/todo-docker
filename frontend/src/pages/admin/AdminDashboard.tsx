import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
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
import api from '../../api/axios';
import { banAdminUser, deleteAdminUser, deleteAdminTodo } from '../../api/admin.api';


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

const todoSortOptions = [
  { value: 'due_date', label: 'Ngày đến hạn' },
  { value: 'priority', label: 'Ưu tiên' },
  { value: 'created_at', label: 'Ngày tạo' },
];

function TabPanel({ value, index, children }: { value: number; index: number; children: ReactNode }) {
  return value === index ? <Box sx={{ mt: 3 }}>{children}</Box> : null;
}

type AdminUser = {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  isBanned: boolean;
  createdAt: string;
};

type AdminTodo = {
  id: number;
  title: string;
  priority: string;
  status: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';
  dueDate: string | null;
  user: { email: string };
  tags: Array<{ name: string }>;
};

type UserStat = {
  id: number;
  email: string;
  createdAt: string;
  isBanned: boolean;
  totalTodos: number;
  completedTodos: number;
  todoTodos: number;
  completionRate: number;
};

export default function AdminDashboard() {
  const [tabIndex, setTabIndex] = useState(0);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);

  // Get Redux state and dispatch
  const { list: todos, total: todoTotal, summary: overview, isLoading: todoLoading } = useSelector(
    (state: any) => state.todos,
  );
  const overviewLoading = todoLoading;
  const dispatch = useDispatch();
  const currentUser = useAuthStore((state) => state.user);

  // Filter controls for todos
  const [todoSearch, setTodoSearch] = useState('');
  const [todoStatus, setTodoStatus] = useState('all');
  const [todoPriority, setTodoPriority] = useState('all');
  const [todoSortBy, setTodoSortBy] = useState('due_date');
  const [todoOrder, setTodoOrder] = useState<'asc' | 'desc'>('asc');
  const [todoPage, setTodoPage] = useState(1);

  const adminTodoQuery: AdminTodosQuery = useMemo(
    () => ({
      page: todoPage,
      limit: 10,
      status: todoStatus,
      priority: todoPriority,
      sortBy: todoSortBy,
      order: todoOrder.toUpperCase(),
      search: todoSearch,
    }),
    [todoPage, todoStatus, todoPriority, todoSortBy, todoOrder, todoSearch],
  );

  const loadAdminTodos = () => {
    dispatch(fetchTodosAndSummary(adminTodoQuery) as any);
  };

  const loadUserStats = async () => {
    try {
      const response = await api.get('/admin/stats/users');
      setUserStats(response.data);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadUsers = async () => {
    setUserLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/users', {
        params: {
          page: userPage,
          limit: 10,
          search: userSearch
        }
      });
      setUsers(response.data.items || []);
      setUserTotal(response.data.total || 0);
    } catch (error) {
      setError('Không thể tải danh sách người dùng');
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    loadAdminTodos();
    loadUserStats();
    loadUsers();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [userPage, userSearch]);

  useEffect(() => {
    loadAdminTodos();
  }, [todoPage, todoStatus, todoPriority, todoSortBy, todoOrder, todoSearch]);

  const handleBanToggle = async (user: AdminUser) => {
    setError(null);
    try {
      await banAdminUser(user.id, !user.isBanned);
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, isBanned: !item.isBanned } : item)),
      );
      // Refresh all data
      dispatch(fetchTodosAndSummary(adminTodoQuery) as any);
      loadUserStats();
    } catch {
      setError('Không thể cập nhật trạng thái ban của người dùng');
    }
  };

  const handleDeleteUser = async (id: number) => {
    setError(null);
    try {
      await deleteAdminUser(id);
      setUsers((current) => current.filter((item) => item.id !== id));
      setUserTotal((prev) => Math.max(prev - 1, 0));
      // Refresh all data
      dispatch(fetchTodosAndSummary(adminTodoQuery) as any);
      loadUserStats();
    } catch {
      setError('Không thể xoá người dùng');
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setError(null);
    try {
      await deleteAdminTodo(id);
      // Refresh the Redux store after deletion
      dispatch(fetchTodosAndSummary(adminTodoQuery) as any);
    } catch {
      setError('Không thể xoá todo');
    }
  };

  const summaryCards = useMemo(
    () => [
      { label: 'Người dùng', value: overview?.totalUsers ?? 0, color: 'primary' as const },
      { label: 'Admin', value: overview?.totalAdmins ?? 0, color: 'info' as const },
      { label: 'Tổng todo', value: overview?.totalTodos ?? 0, color: 'secondary' as const },
      { label: 'Chưa làm', value: overview?.todo ?? 0, color: 'default' as const },
      { label: 'Đang làm', value: overview?.in_progress ?? 0, color: 'info' as const },
      { label: 'Hoàn thành', value: overview?.done ?? 0, color: 'success' as const },
      { label: 'Quá hạn', value: overview?.overdue ?? 0, color: 'error' as const },
      { label: 'Đã hủy', value: overview?.cancelled ?? 0, color: 'warning' as const },
    ],
    [overview],
  );

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box>
        <Typography variant="h4">Quản trị hệ thống</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Quản lý người dùng, công việc và theo dõi thống kê toàn hệ thống.
        </Typography>
      </Box>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Tổng quan hệ thống
        </Typography>
        {overviewLoading ? (
          <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(4, 1fr)',
                lg: 'repeat(8, 1fr)',
              },
            }}
          >
            {summaryCards.map((card) => (
              <Paper key={card.label} sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600 }}>
                  {card.label}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, mt: 0.5 }}
                  color={card.color === 'default' ? 'text.primary' : `${card.color}.main`}
                >
                  {card.value}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)}>
          <Tab label="Người dùng" />
          <Tab label="Công việc" />
          <Tab label="Thống kê" />
        </Tabs>
      </Box>

      <TabPanel value={tabIndex} index={0}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Tìm kiếm user"
              value={userSearch}
              onChange={(event) => {
                setUserSearch(event.target.value);
                setUserPage(1);
              }}
              sx={{ width: { xs: '100%', sm: 320 } }}
            />
            <Typography variant="body2" color="text.secondary">
              Tổng: {userTotal} người dùng
            </Typography>
          </Stack>
        </Paper>

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell align="right">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Không tìm thấy người dùng.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.isBanned ? 'Banned' : 'Active'}
                          color={user.isBanned ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {user.id !== currentUser?.id ? (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleBanToggle(user)}
                            >
                              {user.isBanned ? 'Unban' : 'Ban'}
                            </Button>
                          ) : null}
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Xóa
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Pagination
            count={Math.ceil(userTotal / 10)}
            page={userPage}
            onChange={(_, value) => setUserPage(value)}
            color="primary"
            shape="rounded"
          />
        </Box>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Tìm kiếm todo hoặc người dùng"
              value={todoSearch}
              onChange={(event) => {
                setTodoSearch(event.target.value);
                setTodoPage(1);
              }}
              sx={{ width: { xs: '100%', sm: 280 } }}
            />
            <FormControl sx={{ minWidth: 140 }}>
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
            <FormControl sx={{ minWidth: 140 }}>
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
            <FormControl sx={{ minWidth: 140 }}>
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
            </FormControl>
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel id="todo-order-label">Thứ tự</InputLabel>
              <Select
                labelId="todo-order-label"
                value={todoOrder}
                label="Thứ tự"
                onChange={(event: SelectChangeEvent<'asc' | 'desc'>) => setTodoOrder(event.target.value as 'asc' | 'desc')}
              >
                <MenuItem value="asc">Tăng dần</MenuItem>
                <MenuItem value="desc">Giảm dần</MenuItem>
              </Select>
            </FormControl>
          </Stack>
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
                  todos.map((todo: AdminTodo) => (
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
                            todo.status === 'done' ? 'Hoàn thành' :
                            todo.status === 'in_progress' ? 'Đang làm' :
                            todo.status === 'todo' ? 'Chưa làm' :
                            todo.status === 'overdue' ? 'Quá hạn' :
                            todo.status === 'cancelled' ? 'Đã hủy' : 'Không xác định'
                          }
                          color={
                            todo.status === 'done' ? 'success' :
                            todo.status === 'in_progress' ? 'info' :
                            todo.status === 'todo' ? 'default' :
                            todo.status === 'overdue' ? 'error' :
                            todo.status === 'cancelled' ? 'warning' : 'default'
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Pagination
            count={Math.ceil(todoTotal / 10)}
            page={todoPage}
            onChange={(_, value) => setTodoPage(value)}
            color="primary"
            shape="rounded"
          />
        </Box>
      </TabPanel>

      <TabPanel value={tabIndex} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Thống kê theo người dùng</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Danh sách người dùng với số lượng todo và tỷ lệ hoàn thành.
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Tạo lúc</TableCell>
                  <TableCell>Todo</TableCell>
                  <TableCell>Hoàn thành</TableCell>
                  <TableCell>Chưa làm</TableCell>
                  <TableCell>Tỷ lệ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Không có dữ liệu thống kê.
                    </TableCell>
                  </TableRow>
                ) : (
                  userStats.map((stat) => (
                    <TableRow key={stat.id} hover>
                      <TableCell>{stat.email}</TableCell>
                      <TableCell>{new Date(stat.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{stat.totalTodos}</TableCell>
                      <TableCell>{stat.completedTodos}</TableCell>
                      <TableCell>{stat.todoTodos}</TableCell>
                      <TableCell>{stat.completionRate}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>
    </Box>
  );
}
