import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';

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
  const [showActions, setShowActions] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const paperRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const swipeDistance = touchStart - touchEnd;

    // Swipe left > 50px to reveal actions
    if (swipeDistance > 50) {
      setShowActions(true);
    }
    // Swipe right to hide actions
    else if (swipeDistance < -50) {
      setShowActions(false);
    }
  };

  const handleBackdropClick = () => {
    setShowActions(false);
  };

  return (
    <>
      {showActions && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 9,
          }}
          onClick={handleBackdropClick}
        />
      )}
      <Paper
        ref={paperRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {/* Hidden Action Panel */}
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            pr: 1,
            zIndex: 10,
            backgroundColor: '#f5f5f5',
            width: showActions ? '100%' : 0,
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {showActions && (
            <>
              {!isCurrentUser && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    onBanToggle(id, !isBanned);
                    setShowActions(false);
                  }}
                  color={isBanned ? 'success' : 'warning'}
                  sx={{ minWidth: 56 }}
                >
                  {isBanned ? 'Unban' : 'Ban'}
                </Button>
              )}
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  onDelete(id);
                  setShowActions(false);
                }}
                sx={{ minWidth: 48, minHeight: 48 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleBackdropClick}
                sx={{ minWidth: 48, minHeight: 48 }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            p: 2,
            pr: showActions ? 'calc(100% - 20px)' : 2,
            transition: 'padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            zIndex: 1,
            backgroundColor: '#fff',
          }}
        >
          <Stack spacing={1.5}>
            {/* Email */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                {email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(createdAt).toLocaleDateString('vi-VN')}
              </Typography>
            </Box>

            {/* Role and Status */}
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={role}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ minHeight: 28 }}
              />
              <Chip
                label={isBanned ? 'Banned' : 'Active'}
                color={isBanned ? 'error' : 'success'}
                size="small"
                sx={{ minHeight: 28 }}
              />
            </Stack>

            {/* Swipe Hint */}
            {!showActions && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontStyle: 'italic', mt: 1 }}
              >
                Vuốt trái để xem hành động
              </Typography>
            )}
          </Stack>
        </Box>
      </Paper>
    </>
  );
}
