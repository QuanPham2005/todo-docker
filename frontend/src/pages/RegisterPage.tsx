import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { register } from '../api/auth.api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await register({ email, password });
      setSuccess('Đăng ký thành công. Chuyển tới trang đăng nhập...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, bgcolor: 'white', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <PersonAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Đăng ký
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
          {success ? (
            <Typography color="success.main" variant="body2" sx={{ mt: 1 }}>
              {success}
            </Typography>
          ) : null}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Đăng ký
          </Button>
          <Button component={RouterLink} to="/login" fullWidth>
            Đã có tài khoản? Đăng nhập
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
