import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';
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
import { fetchAdminUsers, banAdminUser, deleteAdminUser, fetchAdminTodos, deleteAdminTodo, fetchAdminStats, fetchAdminUserStats } from '../../api/admin.api';

const todoStatusOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chưa hoàn thành' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'overdue', label: 'Quá hạn' },
];

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
  completed: boolean;
  status: 'pending' | 'completed' | 'overdue';
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
  pendingTodos: number;
  completionRate: number;
};

type StatsOverview = {
  totalUsers: number;
  totalAdmins: number;
  totalTodos: number;
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
  cancelled: number;
};

export default function AdminDashboard() {
  const [tabIndex, setTabIndex] = useState(0);
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [todos, setTodos] = useState<AdminTodo[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [todoLoading, setTodoLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [todoSearch, setTodoSearch] = useState('');
  const [todoStatus, setTodoStatus] = useState('all');
  const [todoPriority, setTodoPriority] = useState('all');
  const [todoSortBy, setTodoSortBy] = useState('due_date');
  const [todoOrder, setTodoOrder] = useState<'asc' | 'desc'>('asc');
  const [todoPage, setTodoPage] = useState(1);
  const [todoTotal, setTodoTotal] = useState(0);
  const currentUser = useAuthStore((state) => state.user);

  const loadOverview = () => {
    setOverviewLoading(true);
    fetchAdminStats()
      .then(setOverview)
      .catch(() => setError('Không thể tải thống kê tổng quan'))
      .finally(() => setOverviewLoading(false));
  };

  const loadUserStats = () => {
    fetchAdminUserStats().then(setUserStats).catch(() => null);
  };

  const loadUsers = () => {
    setUserLoading(true);
    setError(null);
    fetchAdminUsers({ page: userPage, limit: 10, search: userSearch })
      .then((data) => {
        setUsers(data.items || []);
        setUserTotal(data.total || 0);
      })
      .catch(() => setError('Không thể tải danh sách người dùng'))
      .finally(() => setUserLoading(false));
  };

  const loadTodos = () => {
    setTodoLoading(true);
    setError(null);
    const params: Record<string, string | number> = {
      page: todoPage,
      limit: 10,
      status: todoStatus,
      sortBy: todoSortBy,
      order: todoOrder,
    };
    if (todoSearch.trim()) {
      params.search = todoSearch.trim();
    }
    if (todoPriority !== 'all') {
      params.priority = todoPriority;
    }

    fetchAdminTodos(params)
      .then((data) => {
        setTodos(data.items || []);
        setTodoTotal(data.total || 0);
      })
      .catch(() => setError('Không thể tải danh sách todo'))
      .finally(() => setTodoLoading(false));
  };

  useEffect(() => {
    loadOverview();
    loadUserStats();
    loadUsers();
    loadTodos();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [userPage, userSearch]);

  useEffect(() => {
    loadTodos();
  }, [todoPage, todoStatus, todoPriority, todoSortBy, todoOrder, todoSearch]);

  const handleBanToggle = async (user: AdminUser) => {
    setError(null);
    try {
      await banAdminUser(user.id, !user.isBanned);
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, isBanned: !item.isBanned } : item)),
      );
      loadOverview();
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
      loadOverview();
      loadUserStats();
    } catch {
      setError('Không thể xoá người dùng');
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setError(null);
    try {
      await deleteAdminTodo(id);
      setTodos((current) => current.filter((item) => item.id !== id));
      setTodoTotal((prev) => Math.max(prev - 1, 0));
      loadOverview();
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
      <Typography variant="h4">Quản trị hệ thống</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Tổng quan hệ thống</Typography>
        {overviewLoading ? (
          <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            {summaryCards.map((card) => (
              <Paper key={card.label} variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography color="text.secondary" variant="subtitle2">
                  {card.label}
                </Typography>
                <Typography variant="h5" color={`${card.color}.main`}>
                  {card.value}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)}>
          <Tab label="Users" />
          <Tab label="Todos" />
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
              label="Tìm kiếm todo"
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
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
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
                  todos.map((todo) => (
                    <TableRow key={todo.id} hover>
                      <TableCell>{todo.title}</TableCell>
                      <TableCell>{todo.user.email}</TableCell>
                      <TableCell>{todo.priority}</TableCell>
                      <TableCell>
                        {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'Chưa đặt'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            todo.completed
                              ? 'Hoàn thành'
                              : todo.status === 'overdue' ||
                                ((todo.status === 'pending' || !todo.status) &&
                                  todo.dueDate &&
                                  new Date(todo.dueDate) < new Date(new Date().toDateString()))
                              ? 'Quá hạn'
                              : 'Chưa hoàn thành'
                          }
                          color={
                            todo.completed
                              ? 'success'
                              : todo.status === 'overdue' ||
                                ((todo.status === 'pending' || !todo.status) &&
                                  todo.dueDate &&
                                  new Date(todo.dueDate) < new Date(new Date().toDateString()))
                              ? 'error'
                              : 'warning'
                          }
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
                  <TableCell>Chưa hoàn thành</TableCell>
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
                      <TableCell>{stat.pendingTodos}</TableCell>
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
