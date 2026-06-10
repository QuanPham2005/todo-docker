import Box from '@mui/material/Box';
import { memo } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import type { DragEvent } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';

export type TodoItem = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  sortOrder?: number;
  status: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';
  cancellationReason?: string | null;
  tags: Array<{ name: string }>;
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  Low: { color: '#22a06b', bg: '#dcfff1' },
  Medium: { color: '#e2780f', bg: '#fff7d6' },
  High: { color: '#c9372c', bg: '#ffeceb' },
};

const priorityLabelMap: Record<string, string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
};

type Props = {
  todo: TodoItem;
  onEdit: (todo: TodoItem) => void;
  onStart: (todo: TodoItem) => void;
  onComplete: (todo: TodoItem) => void;
  onCancel: (id: number) => void;
  onDelete: (id: number) => void;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (event: DragEvent<HTMLDivElement>, todo: TodoItem) => void;
  onDragEnd?: (event: DragEvent<HTMLDivElement>, todo: TodoItem) => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>, todo: TodoItem) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>, todo: TodoItem) => void;
  isDropTarget?: boolean;
  isDragActive?: boolean;
};

function TodoCard({
  todo,
  onEdit,
  onStart,
  onComplete,
  onCancel,
  onDelete,
  draggable = true,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDropTarget = false,
  isDragActive = false,
}: Props) {
  const prio = priorityConfig[todo.priority] ?? priorityConfig.Low;
  const isClosed = ['overdue', 'done', 'cancelled'].includes(todo.status);

  return (
    <Paper
      draggable={draggable}
      onDragStart={(event) => {
        if (!draggable) return;
        onDragStart?.(event, todo);
      }}
      onDragEnd={(event) => {
        onDragEnd?.(event, todo);
      }}
      onDragOver={(event) => {
        onDragOver?.(event, todo);
      }}
      onDrop={(event) => {
        onDrop?.(event, todo);
      }}
      sx={{
        p: 1.75,
        borderRadius: 2,
        boxShadow: '0 1px 1px rgba(9,30,66,0.12)',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        cursor: draggable ? 'grab' : 'default',
        userSelect: 'none',
        opacity: isDragging ? 0.65 : 1,
        outline: isDropTarget ? '2px solid #0c66e4' : '2px solid transparent',
        outlineOffset: 0,
        '&:hover': {
          boxShadow: '0 4px 12px rgba(9,30,66,0.18)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Stack spacing={1}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, letterSpacing: '0.04em', color: 'text.secondary' }}
        >
          #{todo.id}
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {todo.title}
          </Typography>
          <Chip
            label={priorityLabelMap[todo.priority] ?? todo.priority}
            size="small"
            sx={{ bgcolor: prio.bg, color: prio.color, flexShrink: 0 }}
          />
        </Stack>

        {todo.description ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {todo.description}
          </Typography>
        ) : null}

        {todo.cancellationReason && todo.status === 'cancelled' ? (
          <Typography variant="caption" color="error" sx={{ fontStyle: 'italic' }}>
            Đã hủy: {todo.cancellationReason}
          </Typography>
        ) : null}

        {todo.tags.length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {todo.tags.map((tag) => (
              <Chip
                key={tag.name}
                label={tag.name}
                size="small"
                variant="outlined"
                sx={{ color: 'text.secondary' }}
              />
            ))}
          </Stack>
        ) : null}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'text.secondary',
          }}
        >
          <EventOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'Chưa đặt ngày'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, pt: 0.5 }}>
          {isClosed ? (
            <Tooltip title="Xóa">
              <IconButton size="small" color="error" onClick={() => onDelete(todo.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <>
              <Tooltip title="Sửa">
                <IconButton size="small" onClick={() => onEdit(todo)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {todo.status === 'todo' ? (
                <Tooltip title="Bắt đầu">
                  <IconButton size="small" color="primary" onClick={() => onStart(todo)}>
                    <PlayArrowRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
              {todo.status === 'in_progress' ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<DoneIcon />}
                  onClick={() => onComplete(todo)}
                  sx={{ px: 1 }}
                >
                  Xong
                </Button>
              ) : null}
              <Tooltip title="Hủy">
                <IconButton size="small" color="warning" onClick={() => onCancel(todo.id)}>
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Xóa">
                <IconButton size="small" color="error" onClick={() => onDelete(todo.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

export default memo(TodoCard, (prev, next) =>
  prev.todo === next.todo &&
  prev.draggable === next.draggable &&
  prev.isDragging === next.isDragging &&
  prev.isDropTarget === next.isDropTarget &&
  prev.isDragActive === next.isDragActive,
);
