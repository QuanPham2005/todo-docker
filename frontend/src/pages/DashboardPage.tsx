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
  completed: boolean;
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
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    let completed = 0;
    let pending = 0;
    let overdue = 0;
    let dueSoon = 0;

    const normalizeDate = (date: Date | null) => {
      if (!date) return null;
      const result = new Date(date);
      result.setHours(0, 0, 0, 0);
      return result;
    };

    todos.forEach((todo) => {
      const dueDate = normalizeDate(todo.dueDate ? new Date(todo.dueDate) : null);
      const todayDate = normalizeDate(today);
      const nextWeekDate = normalizeDate(nextWeek);
      const isOverdue = todo.completed === false && dueDate !== null && dueDate < todayDate!;
      if (todo.completed) {
        completed += 1;
      } else if (isOverdue) {
        overdue += 1;
      } else {
        pending += 1;
      }

      if (!todo.completed && dueDate) {
        if (!isOverdue && dueDate <= nextWeekDate!) {
          dueSoon += 1;
        }
      }
    });

    return {
      total: todos.length,
      completed,
      pending,
      overdue,
      dueSoon,
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
              Xem nhanh số todo đã hoàn thành, còn lại, quá hạn và sắp đến hạn trong vòng 7 ngày.
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {['Tổng', 'Hoàn thành', 'Chưa hoàn thành', 'Quá hạn', 'Sắp đến hạn'].map((label, index) => {
                const value =
                  index === 0
                    ? stats.total
                    : index === 1
                    ? stats.completed
                    : index === 2
                    ? stats.pending
                    : index === 3
                    ? stats.overdue
                    : stats.dueSoon;
                return (
                  <Paper key={label} variant="outlined" sx={{ p: 2, minWidth: 130, flex: '1 1 140px' }}>
                    <Typography color="text.secondary" variant="subtitle2">
                      {label}
                    </Typography>
                    {loading ? (
                      <Skeleton width={60} />
                    ) : (
                      <Typography variant="h5">{value}</Typography>
                    )}
                  </Paper>
                );
              })}
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
