import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

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
  return (
    <Paper
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        cursor: draggable ? 'grab' : 'default',
        '&:active': {
          cursor: draggable ? 'grabbing' : 'default',
        },
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 2,
        },
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
            />
            <Chip
              label={priorityLabelMap[priority] || priority}
              color={priorityColorMap[priority] as any}
              size="small"
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
              <Chip key={tag.name} label={tag.name} size="small" variant="outlined" />
            ))}
          </Stack>
        )}

        {/* Delete Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5 }}>
          <IconButton size="small" color="error" onClick={() => onDelete(id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Stack>
    </Paper>
  );
}
