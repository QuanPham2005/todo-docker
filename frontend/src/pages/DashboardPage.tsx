import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { fetchTodoStats } from '../api/todos.api';

type StatCard = {
  key: string;
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: React.ReactNode;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    overdue: 0,
    cancelled: 0,
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTodoStats()
      .then((statsData) => {
        setStats({
          total:
            statsData.todo +
            statsData.in_progress +
            statsData.done +
            statsData.overdue +
            statsData.cancelled,
          todo: statsData.todo,
          inProgress: statsData.in_progress,
          done: statsData.done,
          overdue: statsData.overdue,
          cancelled: statsData.cancelled,
        });
      })
      .catch(() => {
        setError('Không thể tải dữ liệu todo. Vui lòng thử lại.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const cards: StatCard[] = [
    {
      key: 'total',
      label: 'Tổng số',
      value: stats.total,
      color: '#0c66e4',
      bg: '#e9f2ff',
      icon: <ChecklistRoundedIcon />,
    },
    {
      key: 'todo',
      label: 'Cần làm',
      value: stats.todo,
      color: '#5e6c84',
      bg: '#ebecf0',
      icon: <RadioButtonUncheckedIcon />,
    },
    {
      key: 'inProgress',
      label: 'Đang làm',
      value: stats.inProgress,
      color: '#0c66e4',
      bg: '#e9f2ff',
      icon: <AutorenewRoundedIcon />,
    },
    {
      key: 'done',
      label: 'Hoàn thành',
      value: stats.done,
      color: '#22a06b',
      bg: '#dcfff1',
      icon: <CheckCircleRoundedIcon />,
    },
    {
      key: 'overdue',
      label: 'Quá hạn',
      value: stats.overdue,
      color: '#c9372c',
      bg: '#ffeceb',
      icon: <ErrorOutlineRoundedIcon />,
    },
    {
      key: 'cancelled',
      label: 'Đã hủy',
      value: stats.cancelled,
      color: '#e2780f',
      bg: '#fff7d6',
      icon: <CancelRoundedIcon />,
    },
  ];

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
          <Typography variant="h4">Bảng điều khiển</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tổng quan nhanh về tiến độ công việc của bạn.
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/todos"
          variant="contained"
          endIcon={<ArrowForwardRoundedIcon />}
        >
          Quản lý Todo
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            lg: 'repeat(6, 1fr)',
          },
        }}
      >
        {cards.map((card) => (
          <Paper key={card.key} sx={{ p: 2.5, borderRadius: 2.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: card.bg,
                color: card.color,
                mb: 1.5,
              }}
            >
              {card.icon}
            </Box>
            {loading ? (
              <Skeleton width={48} height={36} />
            ) : (
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {card.value}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {card.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
        <Paper sx={{ p: 3, borderRadius: 2.5 }}>
          <Typography variant="h6" gutterBottom>
            Tỷ lệ hoàn thành
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Phần trăm công việc đã hoàn thành trên tổng số.
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'success.main' }}>
              {loading ? <Skeleton width={80} /> : `${completionRate}%`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.done}/{stats.total} công việc
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={completionRate}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: '#ebecf0',
              '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: 'success.main' },
            }}
          />
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 2.5, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Gợi ý tiếp theo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sắp xếp todo theo độ ưu tiên hoặc trạng thái để tập trung vào những công việc quan trọng
            nhất.
          </Typography>
          <Box sx={{ mt: 'auto' }}>
            <Button component={RouterLink} to="/todos" variant="outlined" fullWidth>
              Mở bảng công việc
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
