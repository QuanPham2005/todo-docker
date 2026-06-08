import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';

const highlights = [
  { icon: <CheckCircleRoundedIcon />, text: 'Quản lý công việc theo bảng trực quan' },
  { icon: <BoltRoundedIcon />, text: 'Cập nhật trạng thái nhanh chóng' },
  { icon: <InsightsRoundedIcon />, text: 'Theo dõi tiến độ theo thời gian thực' },
];

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: 'background.default',
      }}
    >
      {/* Brand panel */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: '#fff',
          background: 'linear-gradient(150deg, #0c66e4 0%, #0747a6 60%, #042a72 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,0.16)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <ViewKanbanIcon />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            TaskBoard
          </Typography>
        </Box>

        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.15, mb: 2, letterSpacing: '-0.02em' }}>
            Tổ chức công việc,
            <br />
            hoàn thành mục tiêu.
          </Typography>
          <Typography sx={{ opacity: 0.85, mb: 4, maxWidth: 420 }}>
            Một không gian gọn gàng để lập kế hoạch, theo dõi và hoàn thành mọi nhiệm vụ của bạn.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {highlights.map((h) => (
              <Box key={h.text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.14)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {h.icon}
                </Box>
                <Typography sx={{ fontWeight: 500 }}>{h.text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          © {new Date().getFullYear()} TaskBoard. Quản lý công việc thông minh.
        </Typography>
      </Box>

      {/* Form panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 420,
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            boxShadow: '0 8px 28px rgba(9,30,66,0.12)',
          }}
        >
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ViewKanbanIcon fontSize="small" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              TaskBoard
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {subtitle}
          </Typography>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
