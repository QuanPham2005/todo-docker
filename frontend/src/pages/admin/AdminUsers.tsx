import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
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
import { useTheme, useMediaQuery } from '@mui/material';
import api from '../../api/axios';
import { banAdminUser, deleteAdminUser } from '../../api/admin.api';
import AdminUserCard from '../../components/admin/AdminUserCard';

type AdminUser = {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  isBanned: boolean;
  createdAt: string;
};

export default function AdminUsers() {
  const currentUser = useAuthStore((state) => state.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);

  const loadUsers = async () => {
    setUserLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/users', {
        params: { page: userPage, limit: 10, search: userSearch },
      });
      setUsers(response.data.items || []);
      setUserTotal(response.data.total || 0);
    } catch {
      setError('Không thể tải danh sách người dùng');
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPage, userSearch]);

  const handleBanToggle = async (userId: number, isBanned: boolean) => {
    setError(null);
    try {
      await banAdminUser(userId, isBanned);
      setUsers((current) =>
        current.map((item) => (item.id === userId ? { ...item, isBanned } : item)),
      );
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
    } catch {
      setError('Không thể xoá người dùng');
    }
  };

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box>
        <Typography variant="h4">Quản lý người dùng</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Tìm kiếm, khoá/mở khoá và xoá tài khoản người dùng.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            label="Tìm kiếm user"
            value={userSearch}
            onChange={(event) => {
              setUserSearch(event.target.value);
              setUserPage(1);
            }}
            fullWidth
            sx={{ width: { xs: '100%', sm: 320 } }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
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
                          <Button size="small" variant="outlined" onClick={() => handleBanToggle(user)}>
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

      <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
        <Pagination
          count={Math.ceil(userTotal / 10)}
          page={userPage}
          onChange={(_, value) => setUserPage(value)}
          color="primary"
          shape="rounded"
        />
      </Box>
    </Box>
  );
}
