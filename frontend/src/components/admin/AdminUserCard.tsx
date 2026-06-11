import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

type AdminUserCardProps = {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  isBanned: boolean;
  createdAt: string;
  isCurrentUser: boolean;
  onBanToggle: (id: number, isBanned: boolean) => void;
  onDelete: (id: number) => void;
};

export default function AdminUserCard({
  id,
  email,
  role,
  isBanned,
  createdAt,
  isCurrentUser,
  onBanToggle,
  onDelete,
}: AdminUserCardProps) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={1.5}>
        {/* Email */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
            {email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(createdAt).toLocaleDateString('vi-VN')}
          </Typography>
        </Box>

        {/* Role and Status */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip label={role} size="small" color="primary" variant="outlined" />
          <Chip
            label={isBanned ? 'Banned' : 'Active'}
            color={isBanned ? 'error' : 'success'}
            size="small"
          />
        </Stack>

        <Divider />

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          {!isCurrentUser && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => onBanToggle(id, !isBanned)}
              color={isBanned ? 'success' : 'warning'}
            >
              {isBanned ? 'Unban' : 'Ban'}
            </Button>
          )}
          <Button size="small" color="error" variant="contained" onClick={() => onDelete(id)}>
            Xóa
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
