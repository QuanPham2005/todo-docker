import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import api from '../../api/axios';

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

export default function AdminStats() {
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/stats/users')
      .then((response) => setUserStats(response.data))
      .catch((error) => console.error('Failed to load user stats:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box>
        <Typography variant="h4">Thống kê</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Số lượng todo và tỷ lệ hoàn thành theo từng người dùng.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Thống kê theo người dùng</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : userStats.length === 0 ? (
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
    </Box>
  );
}
