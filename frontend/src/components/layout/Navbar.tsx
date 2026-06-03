import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = () => {
    clearSession();
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Button component={RouterLink} to="/dashboard" color="inherit">
            Todo App
          </Button>
          <Button component={RouterLink} to="/todos" color="inherit">
            Todos
          </Button>
          {user?.role === 'ADMIN' ? (
            <Button component={RouterLink} to="/admin" color="inherit">
              Admin
            </Button>
          ) : null}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">{user?.email || 'Guest'}</Typography>
          <Button color="inherit" onClick={handleLogout} component={RouterLink} to="/login">
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
