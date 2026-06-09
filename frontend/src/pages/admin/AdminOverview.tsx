import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { fetchTodosAndSummary } from '../../store/todosSlice';

type StatCardConfig = {
  key: string;
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: React.ReactNode;
};

export default function AdminOverview() {
  const dispatch = useDispatch();
  const { summary: overview, isLoading } = useSelector((state: any) => state.todos);

  // Track ordering of the stat cards so they can be rearranged.
  const [order, setOrder] = useState<string[]>([
    'totalUsers',
    'totalAdmins',
    'totalTodos',
    'todo',
    'in_progress',
    'done',
    'overdue',
    'cancelled',
  ]);
  const [dragKey, setDragKey] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchTodosAndSummary({ page: 1, limit: 10 }) as any);
  }, [dispatch]);

  const cardMap = useMemo<Record<string, StatCardConfig>>(
    () => ({
      totalUsers: {
        key: 'totalUsers',
        label: 'Người dùng',
        value: overview?.totalUsers ?? 0,
        color: '#0c66e4',
        bg: '#e9f2ff',
        icon: <PeopleAltRoundedIcon />,
      },
      totalAdmins: {
        key: 'totalAdmins',
        label: 'Admin',
        value: overview?.totalAdmins ?? 0,
        color: '#0c66e4',
        bg: '#e9f2ff',
        icon: <AdminPanelSettingsRoundedIcon />,
      },
      totalTodos: {
        key: 'totalTodos',
        label: 'Tổng todo',
        value: overview?.totalTodos ?? 0,
        color: '#5e6c84',
        bg: '#ebecf0',
        icon: <ChecklistRoundedIcon />,
      },
      todo: {
        key: 'todo',
        label: 'Chưa làm',
        value: overview?.todo ?? 0,
        color: '#5e6c84',
        bg: '#ebecf0',
        icon: <RadioButtonUncheckedRoundedIcon />,
      },
      in_progress: {
        key: 'in_progress',
        label: 'Đang làm',
        value: overview?.in_progress ?? 0,
        color: '#0c66e4',
        bg: '#e9f2ff',
        icon: <AutorenewRoundedIcon />,
      },
      done: {
        key: 'done',
        label: 'Hoàn thành',
        value: overview?.done ?? 0,
        color: '#22a06b',
        bg: '#dcfff1',
        icon: <CheckCircleRoundedIcon />,
      },
      overdue: {
        key: 'overdue',
        label: 'Quá hạn',
        value: overview?.overdue ?? 0,
        color: '#c9372c',
        bg: '#ffeceb',
        icon: <ErrorOutlineRoundedIcon />,
      },
      cancelled: {
        key: 'cancelled',
        label: 'Đã hủy',
        value: overview?.cancelled ?? 0,
        color: '#e2780f',
        bg: '#fff7d6',
        icon: <CancelRoundedIcon />,
      },
    }),
    [overview],
  );

  const totalTodos = overview?.totalTodos ?? 0;
  const completionRate = totalTodos > 0 ? Math.round(((overview?.done ?? 0) / totalTodos) * 100) : 0;

  const handleDragStart = (key: string) => setDragKey(key);
  const handleDrop = (targetKey: string) => {
    if (!dragKey || dragKey === targetKey) return;
    setOrder((current) => {
      const next = [...current];
      const from = next.indexOf(dragKey);
      const to = next.indexOf(targetKey);
      next.splice(from, 1);
      next.splice(to, 0, dragKey);
      return next;
    });
    setDragKey(null);
  };

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box>
        <Typography variant="h4">Tổng quan hệ thống</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Kéo và thả các ô bên dưới để sắp xếp lại theo ý bạn.
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(4, 1fr)',
              },
            }}
          >
            {order.map((key) => {
              const card = cardMap[key];
              if (!card) return null;
              return (
                <Paper
                  key={card.key}
                  draggable
                  onDragStart={() => handleDragStart(card.key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(card.key)}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    cursor: 'grab',
                    opacity: dragKey === card.key ? 0.5 : 1,
                    transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                    '&:hover': { boxShadow: '0 6px 16px rgba(9,30,66,0.12)' },
                    '&:active': { cursor: 'grabbing' },
                  }}
                >
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
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {card.label}
                  </Typography>
                </Paper>
              );
            })}
          </Box>

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
            <Paper sx={{ p: 3, borderRadius: 2.5 }}>
              <Typography variant="h6" gutterBottom>
                Tỷ lệ hoàn thành toàn hệ thống
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Phần trăm công việc đã hoàn thành trên tổng số todo.
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.5 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'success.main' }}>
                  {completionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {overview?.done ?? 0}/{totalTodos} công việc
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

            <Paper sx={{ p: 3, borderRadius: 2.5 }}>
              <Typography variant="h6" gutterBottom>
                Phân bổ trạng thái
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {[
                  { label: 'Chưa làm', value: overview?.todo ?? 0, color: '#5e6c84' },
                  { label: 'Đang làm', value: overview?.in_progress ?? 0, color: '#0c66e4' },
                  { label: 'Hoàn thành', value: overview?.done ?? 0, color: '#22a06b' },
                  { label: 'Quá hạn', value: overview?.overdue ?? 0, color: '#c9372c' },
                  { label: 'Đã hủy', value: overview?.cancelled ?? 0, color: '#e2780f' },
                ].map((row) => (
                  <Stack
                    key={row.label}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {row.label}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {row.value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Box>
        </>
      )}
    </Box>
  );
}
