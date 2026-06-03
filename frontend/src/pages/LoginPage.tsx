import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuthStore } from '../store/authStore';
import { login } from '../api/auth.api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const data = await login({ email, password });
      if (data?.access_token) {
        setSession(data.access_token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.');
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, bgcolor: 'white', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Đăng nhập
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          ) : null}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Đăng nhập
          </Button>
          <Button component={RouterLink} to="/register" fullWidth>
            Chưa có tài khoản? Đăng ký
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
