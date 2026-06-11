import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';

type AdminTodosCardProps = {
  id: number;
  title: string;
  email: string;
  priority: string;
  status: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';
  dueDate: string | null;
  tags: Array<{ name: string }>;
  priorityLabelMap: Record<string, string>;
  priorityColorMap: Record<string, 'default' | 'success' | 'warning' | 'error'>;
  onDelete: (id: number) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
};

const statusLabelMap: Record<string, string> = {
  done: 'Hoàn thành',
  in_progress: 'Đang làm',
  todo: 'Chưa làm',
  overdue: 'Quá hạn',
  cancelled: 'Đã hủy',
};

const statusColorMap: Record<
  string,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  done: 'success',
  in_progress: 'info',
  todo: 'default',
  overdue: 'error',
  cancelled: 'warning',
};

export default function AdminTodosCard({
  id,
  title,
  email,
  priority,
  status,
  dueDate,
  tags,
  priorityLabelMap,
  priorityColorMap,
  onDelete,
  draggable = false,
  onDragStart,
  onDragEnd,
}: AdminTodosCardProps) {
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
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease-out',
          cursor: draggable ? 'grab' : 'default',
          '&:active': {
            cursor: draggable ? 'grabbing' : 'default',
          },
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
            {/* Title and Status */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, wordBreak: 'break-word' }}>
                {title}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={statusLabelMap[status] || 'Không xác định'}
                  color={statusColorMap[status] as any}
                  size="small"
                  sx={{ minHeight: 28 }}
                />
                <Chip
                  label={priorityLabelMap[priority] || priority}
                  color={priorityColorMap[priority] as any}
                  size="small"
                  sx={{ minHeight: 28 }}
                />
              </Stack>
            </Box>

            {/* User and Date Info */}
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                <strong>Người tạo:</strong> {email}
              </Typography>
              {dueDate && (
                <Typography variant="caption" color="text.secondary">
                  <strong>Hạn chót:</strong> {new Date(dueDate).toLocaleDateString('vi-VN')}
                </Typography>
              )}
            </Stack>

            {/* Tags */}
            {tags.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag.name}
                    label={tag.name}
                    size="small"
                    variant="outlined"
                    sx={{ minHeight: 24 }}
                  />
                ))}
              </Stack>
            )}

            {/* Swipe Hint */}
            {!showActions && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontStyle: 'italic', mt: 1 }}
              >
                Vuốt trái để xóa
              </Typography>
            )}
          </Stack>
        </Box>
      </Paper>
    </>
  );
}
