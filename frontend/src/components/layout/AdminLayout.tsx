import { NavLink, Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Navbar from './Navbar';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';

const SIDEBAR_WIDTH = 264;

const adminNavItems = [
  { label: 'Dashboard', to: '/admin', end: true, icon: <SpaceDashboardRoundedIcon /> },
  { label: 'Quản lý người dùng', to: '/admin/users', end: false, icon: <PeopleAltRoundedIcon /> },
  { label: 'Quản lý công việc', to: '/admin/todos', end: false, icon: <AssignmentRoundedIcon /> },
  { label: 'Thống kê', to: '/admin/stats', end: false, icon: <BarChartRoundedIcon /> },
];

export default function AdminLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Sidebar */}
        <Box
          component="aside"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            bgcolor: '#0f2747',
            color: 'rgba(255,255,255,0.85)',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            position: 'sticky',
            top: 64,
            alignSelf: 'flex-start',
            height: 'calc(100vh - 64px)',
            p: 2,
          }}
        >
          <Typography
            variant="overline"
            sx={{ px: 1.5, mb: 1, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }}
          >
            Quản trị
          </Typography>

          <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={{ textDecoration: 'none' }}
              >
                {({ isActive }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 2.5,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                      bgcolor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                      transition: 'background-color 0.15s ease, color 0.15s ease',
                      '&:hover': {
                        bgcolor: isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
                        color: '#fff',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        bgcolor: isActive ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
                        '& svg': { fontSize: 20 },
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{item.label}</Typography>
                  </Box>
                )}
              </NavLink>
            ))}
          </Box>

          <Box sx={{ mt: 'auto', pt: 2, px: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              © 2026 TaskBoard
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 3, md: 4 },
            maxWidth: 1280,
            mx: 'auto',
            width: '100%',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
