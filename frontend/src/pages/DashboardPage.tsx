import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { fetchTodos } from '../api/todos.api';

type TodoItem = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  status: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';
};

export default function DashboardPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTodos({ page: 1, limit: 100, status: 'all', sortBy: 'due_date', order: 'asc' })
      .then((data) => {
        setTodos(data.items || []);
      })
      .catch(() => {
        setError('Không thể tải dữ liệu todo. Vui lòng thử lại.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    return {
      total: todos.length,
      todo: todos.filter((t) => t.status === 'todo').length,
      inProgress: todos.filter((t) => t.status === 'in_progress').length,
      done: todos.filter((t) => t.status === 'done').length,
      overdue: todos.filter((t) => t.status === 'overdue').length,
      cancelled: todos.filter((t) => t.status === 'cancelled').length,
    };
  }, [todos]);

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h4">Dashboard</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
        <Paper sx={{ p: 3, minHeight: 220 }}>
            <Typography variant="h6" gutterBottom>
              Tổng quan todo của bạn
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Xem nhanh số todo theo 5 trạng thái: Todo, Đang làm, Hoàn thành, Quá hạn, Đã hủy.
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {[
                { label: 'Tổng', value: stats.total },
                { label: 'Todo', value: stats.todo },
                { label: 'Đang làm', value: stats.inProgress },
                { label: 'Hoàn thành', value: stats.done },
                { label: 'Quá hạn', value: stats.overdue },
                { label: 'Đã hủy', value: stats.cancelled },
              ].map(({ label, value }) => (
                <Paper key={label} variant="outlined" sx={{ p: 2, minWidth: 110, flex: '1 1 120px' }}>
                  <Typography color="text.secondary" variant="subtitle2">
                    {label}
                  </Typography>
                  {loading ? (
                    <Skeleton width={60} />
                  ) : (
                    <Typography variant="h5">{value}</Typography>
                  )}
                </Paper>
              ))}
            </Stack>
            <Box sx={{ mt: 3 }}>
              <Button component={RouterLink} to="/todos" variant="contained">
                Quản lý Todo
              </Button>
            </Box>
          </Paper>
        <Paper sx={{ p: 3, minHeight: 220 }}>
            <Typography variant="h6" gutterBottom>
              Gợi ý tiếp theo
            </Typography>
            <Typography>
              Sắp xếp todo theo độ ưu tiên hoặc trạng thái để tập trung vào những công việc quan trọng nhất.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Link component={RouterLink} to="/todos">
                Mở trang todo để lọc và quản lý chi tiết.
              </Link>
            </Box>
          </Paper>
      </Box>
    </Box>
  );
}
