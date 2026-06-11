import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchAdminStats, fetchAdminUserStats } from '../../api/admin.api';

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

type AdminOverview = {
  totalUsers: number;
  totalAdmins: number;
  totalTodos: number;
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
  cancelled: number;
};

const STATUS_COLORS = {
  todo: '#5e6c84',
  in_progress: '#0c66e4',
  done: '#22a06b',
  overdue: '#c9372c',
  cancelled: '#e2780f',
};

const STATUS_LABELS: Record<
  keyof Pick<AdminOverview, 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled'>,
  string
> = {
  todo: 'Chưa làm',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
  overdue: 'Quá hạn',
  cancelled: 'Đã hủy',
};

const KPI_CARDS = [
  {
    key: 'users',
    label: 'Người dùng',
    color: '#0c66e4',
    bg: '#e9f2ff',
    icon: <PeopleAltRoundedIcon />,
  },
  {
    key: 'admins',
    label: 'Admin',
    color: '#5e6c84',
    bg: '#ebecf0',
    icon: <TimelineRoundedIcon />,
  },
  {
    key: 'todos',
    label: 'Tổng todo',
    color: '#22a06b',
    bg: '#dcfff1',
    icon: <AssignmentRoundedIcon />,
  },
  {
    key: 'rate',
    label: 'Tỷ lệ hoàn thành',
    color: '#0c66e4',
    bg: '#e9f2ff',
    icon: <CheckCircleRoundedIcon />,
  },
] as const;

export default function AdminStats() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAdminStats(), fetchAdminUserStats()])
      .then(([overviewData, userStatsData]) => {
        setOverview(overviewData);
        setUserStats(userStatsData);
      })
      .catch((error) => console.error('Failed to load admin stats:', error))
      .finally(() => setLoading(false));
  }, []);

  const completionRate = overview && overview.totalTodos > 0 ? Math.round((overview.done / overview.totalTodos) * 100) : 0;

  const statusChartData = overview
    ? [
        { name: STATUS_LABELS.todo, value: overview.todo, color: STATUS_COLORS.todo },
        { name: STATUS_LABELS.in_progress, value: overview.in_progress, color: STATUS_COLORS.in_progress },
        { name: STATUS_LABELS.done, value: overview.done, color: STATUS_COLORS.done },
        { name: STATUS_LABELS.overdue, value: overview.overdue, color: STATUS_COLORS.overdue },
        { name: STATUS_LABELS.cancelled, value: overview.cancelled, color: STATUS_COLORS.cancelled },
      ]
    : [];

  const topUsersByTodo = [...userStats]
    .sort((left, right) => right.totalTodos - left.totalTodos)
    .slice(0, 6)
    .map((item) => ({
      name: item.email.split('@')[0],
      total: item.totalTodos,
      completed: item.completedTodos,
    }));

  const topUsersByCompletion = [...userStats]
    .sort((left, right) => right.completionRate - left.completionRate)
    .slice(0, 6)
    .map((item) => ({
      name: item.email.split('@')[0],
      rate: item.completionRate,
    }));

  const avgCompletionRate =
    userStats.length > 0
      ? Math.round(userStats.reduce((sum, item) => sum + item.completionRate, 0) / userStats.length)
      : 0;

  const totalCompletedTodos = userStats.reduce((sum, item) => sum + item.completedTodos, 0);
  const totalTodoTodos = userStats.reduce((sum, item) => sum + item.todoTodos, 0);

  return (
    <Box sx={{ display: 'grid', gap: 3.5 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Thống kê
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Tổng quan hệ thống, phân bổ trạng thái todo và hiệu suất theo từng người dùng.
        </Typography>
      </Box>

      {loading ? (
        <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
            }}
          >
            {KPI_CARDS.map((card) => {
              const value =
                card.key === 'users'
                  ? overview?.totalUsers ?? 0
                  : card.key === 'admins'
                    ? overview?.totalAdmins ?? 0
                    : card.key === 'todos'
                      ? overview?.totalTodos ?? 0
                      : `${completionRate}%`;

              return (
                <Paper
                  key={card.key}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 10px 28px rgba(15, 38, 75, 0.06)',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: card.bg,
                        color: card.color,
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                      }}
                    >
                      {card.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {card.label}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                        {value}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {card.key === 'rate'
                      ? 'Tỷ lệ todo đã hoàn thành trên tổng todo hiện có.'
                      : card.key === 'admins'
                        ? 'Số tài khoản quản trị có quyền truy cập dashboard.'
                        : card.key === 'users'
                          ? 'Tổng số người dùng thường trong hệ thống.'
                          : 'Tổng số todo đang được theo dõi.'}
                  </Typography>
                </Paper>
              );
            })}
          </Box>

          <Box
            sx={{
              display: { xs: 'none', lg: 'grid' },
              gap: 3,
              gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' },
            }}
          >
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Phân bổ trạng thái todo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cơ cấu toàn bộ todo theo trạng thái hiện tại.
                  </Typography>
                </Box>
                <Chip label={`Hoàn thành ${completionRate}%`} color="success" variant="outlined" />
              </Stack>

              <Divider sx={{ my: 2.5 }} />

              <Box sx={{ width: '100%', height: { xs: 280, md: 320 } }}>
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {statusChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={28} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Không có dữ liệu biểu đồ.
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Chỉ số nhanh
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Những con số nổi bật nhất từ hệ thống.
              </Typography>

              <Stack spacing={2.25} sx={{ mt: 3 }}>
                {[
                  { label: 'Tổng todo đã hoàn thành', value: totalCompletedTodos, color: '#22a06b' },
                  { label: 'Tổng todo chưa làm', value: totalTodoTodos, color: '#5e6c84' },
                  { label: 'Tỷ lệ hoàn thành trung bình', value: `${avgCompletionRate}%`, color: '#0c66e4' },
                ].map((item) => (
                  <Box key={item.label}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: item.color }}>
                        {item.value}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        height: 8,
                        borderRadius: 999,
                        bgcolor: 'rgba(15, 38, 75, 0.08)',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width:
                            typeof item.value === 'number' && overview?.totalTodos
                              ? `${Math.min(100, Math.round((item.value / overview.totalTodos) * 100))}%`
                              : '100%',
                          bgcolor: item.color,
                          borderRadius: 999,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Box>

          <Box
            sx={{
              display: { xs: 'none', lg: 'grid' },
              gap: 3,
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
            }}
          >
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Top người dùng theo số todo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                So sánh số lượng todo đang phụ trách của từng người dùng.
              </Typography>
              <Box sx={{ width: '100%', height: { xs: 280, md: 320 } }}>
                {topUsersByTodo.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topUsersByTodo}
                      layout="vertical"
                      margin={{ left: 16, right: 24, top: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={96} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" name="Tổng todo" fill="#0c66e4" radius={[0, 10, 10, 0]} />
                      <Bar dataKey="completed" name="Đã hoàn thành" fill="#22a06b" radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Không có dữ liệu biểu đồ.
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Tỷ lệ hoàn thành theo người dùng
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Người dùng nào đang có hiệu suất hoàn thành cao nhất.
              </Typography>
              <Box sx={{ width: '100%', height: { xs: 280, md: 320 } }}>
                {topUsersByCompletion.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={topUsersByCompletion}
                      margin={{ top: 10, right: 24, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} tickFormatter={(value: number) => `${value}%`} />
                      <Tooltip
                        formatter={(value: unknown) => {
                          const normalizedValue = Array.isArray(value) ? value[0] : value;
                          return [`${normalizedValue ?? 0}%`, 'Tỷ lệ hoàn thành'] as [string, string];
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        name="Tỷ lệ hoàn thành"
                        stroke="#22a06b"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Không có dữ liệu biểu đồ.
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: { xs: 'grid', lg: 'none' }, gap: 3 }}>
            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Phân bổ trạng thái todo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tóm tắt trạng thái trên mobile.
              </Typography>
              <Stack spacing={1.25}>
                {statusChartData.map((entry) => {
                  const percentage = overview?.totalTodos ? Math.round((entry.value / overview.totalTodos) * 100) : 0;

                  return (
                    <Box key={entry.name}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                        <Typography variant="body2" color="text.secondary">
                          {entry.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {entry.value} ({percentage}%)
                        </Typography>
                      </Stack>
                      <Box sx={{ height: 8, borderRadius: 999, bgcolor: 'rgba(15, 38, 75, 0.08)', overflow: 'hidden' }}>
                        <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: entry.color, borderRadius: 999 }} />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Chỉ số nhanh
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {[
                  { label: 'Tổng todo đã hoàn thành', value: totalCompletedTodos, color: '#22a06b' },
                  { label: 'Tổng todo chưa làm', value: totalTodoTodos, color: '#5e6c84' },
                  { label: 'Tỷ lệ hoàn thành trung bình', value: `${avgCompletionRate}%`, color: '#0c66e4' },
                ].map((item) => (
                  <Paper key={item.label} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: item.color }}>
                        {item.value}
                      </Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Thống kê theo người dùng
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Danh sách rút gọn cho mobile.
              </Typography>
              <Stack spacing={1.25}>
                {userStats.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Không có dữ liệu thống kê.
                  </Typography>
                ) : (
                  userStats.map((stat) => (
                    <Paper key={stat.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Stack spacing={0.75}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                          {stat.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(stat.createdAt).toLocaleDateString('vi-VN')}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip label={`Todo ${stat.totalTodos}`} size="small" />
                          <Chip label={`HT ${stat.completedTodos}`} size="small" color="success" />
                          <Chip label={`TL ${stat.todoTodos}`} size="small" />
                          <Chip label={`${stat.completionRate}%`} size="small" color="primary" />
                        </Stack>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            </Paper>
          </Box>

          <Paper sx={{ p: 3, borderRadius: 3, display: { xs: 'none', lg: 'block' } }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Thống kê theo người dùng
            </Typography>
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
                        <TableCell>{new Date(stat.createdAt).toLocaleDateString('vi-VN')}</TableCell>
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
        </>
      )}
    </Box>
  );
}
