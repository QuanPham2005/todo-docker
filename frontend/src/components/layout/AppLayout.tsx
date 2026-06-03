import { Outlet } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Navbar from './Navbar';

export default function AppLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Navbar />
      <Container sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
