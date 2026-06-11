import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Navbar from './Navbar';

export default function AppLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, md: 4 },
          pb: { xs: 10, sm: 4 },
          maxWidth: 1280,
          mx: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
