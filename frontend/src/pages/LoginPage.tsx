import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AuthLayout from '../components/layout/AuthLayout';
import { useAuthStore } from '../store/authStore';
import { login } from '../api/auth.api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  const handlePopupClose = () => {
    setPopupOpen(false);
    setPopupMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPopupOpen(false);
    setPopupMessage(null);
    setSubmitting(true);

    try {
      const data = await login({ email, password });
      if (data?.access_token) {
        setSession(data.access_token);
        navigate('/dashboard');
      }
    } catch (err) {
      const responseData = (err as any)?.response?.data;
      let serverMessage: string | undefined;

      if (responseData) {
        if (typeof responseData.message === 'string') {
          serverMessage = responseData.message;
        } else if (typeof responseData.error === 'string') {
          serverMessage = responseData.error;
        } else if (typeof responseData.error?.message === 'string') {
          serverMessage = responseData.error.message;
        } else if (Array.isArray(responseData.error)) {
          serverMessage = responseData.error.join(', ');
        }
      }

      const message =
        serverMessage?.trim().length
          ? serverMessage.trim()
          : 'Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.';

      const normalizedMessage = message.toLowerCase();
      const isBanned =
        normalizedMessage.includes('bị ban') ||
        normalizedMessage.includes('ban') ||
        normalizedMessage.includes('banned');

      if (isBanned) {
        setPopupMessage(message);
        setPopupOpen(true);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Đăng nhập" subtitle="Chào mừng trở lại! Vui lòng nhập thông tin của bạn.">
      <Dialog open={popupOpen} onClose={handlePopupClose}>
        <DialogTitle>Thông báo</DialogTitle>
        <DialogContent>
          <DialogContentText>{popupMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePopupClose}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <TextField
          required
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          required
          fullWidth
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{ mt: 1, py: 1.2 }}
        >
          Đăng nhập
        </Button>
        <Typography variant="body2" color="text.secondary" align="center">
          Chưa có tài khoản?{' '}
          <Link component={RouterLink} to="/register" sx={{ fontWeight: 600 }}>
            Đăng ký ngay
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
