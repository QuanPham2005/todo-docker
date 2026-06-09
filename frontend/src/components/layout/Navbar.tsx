import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Todos', to: '/todos', icon: <ChecklistRoundedIcon fontSize="small" /> },
];

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    setAnchorEl(null);
    clearSession();
    navigate('/login');
  };

  const isActive = (to: string) => location.pathname.startsWith(to);
  const initial = (user?.email || 'G').charAt(0).toUpperCase();

  return (
    <AppBar
      position="sticky"
      elevation={0}        // ← bỏ shadow mặc định
      sx={{
        background: 'linear-gradient(90deg, #0c66e4 0%, #0747a6 100%)',
        color: '#fff',
        borderBottom: 'none',   // ← đảm bảo không có border
        margin: 0,
        padding: 0,
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: { xs: 60, sm: 64 } }}>
        <Box
          component={RouterLink}
          to="/dashboard"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            color: 'inherit',
            mr: 2,
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.16)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <ViewKanbanIcon fontSize="small" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            TaskBoard
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {navItems.map((item) => (
            <Button
              key={item.to}
              component={RouterLink}
              to={item.to}
              color="inherit"
              startIcon={item.icon}
              sx={{
                px: 1.5,
                borderRadius: 2,
                bgcolor: isActive(item.to) ? 'rgba(255,255,255,0.18)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            >
              {item.label}
            </Button>
          ))}
          {user?.role === 'ADMIN' ? (
            <Button
              component={RouterLink}
              to="/admin"
              color="inherit"
              startIcon={<AdminPanelSettingsIcon fontSize="small" />}
              sx={{
                px: 1.5,
                borderRadius: 2,
                bgcolor: isActive('/admin') ? 'rgba(255,255,255,0.18)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            >
              Admin
            </Button>
          ) : null}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography
            variant="body2"
            sx={{ display: { xs: 'none', md: 'block' }, opacity: 0.9, fontWeight: 500 }}
          >
            {user?.email || 'Guest'}
          </Typography>
          <Tooltip title="Tài khoản">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ p: 0.5 }}>
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: '#fff',
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {initial}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 220, borderRadius: 2 } } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {user?.email || 'Guest'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}
            </Typography>
          </Box>
          <Divider />
          {user?.role === 'ADMIN' ? (
            <MenuItem component={RouterLink} to="/admin" onClick={() => setAnchorEl(null)}>
              <ListItemIcon>
                <AdminPanelSettingsIcon fontSize="small" />
              </ListItemIcon>
              Quản trị
            </MenuItem>
          ) : null}
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Đăng xuất
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
