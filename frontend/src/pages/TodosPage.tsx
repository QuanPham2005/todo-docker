import { memo, useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import type { DragEvent } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Pagination from '@mui/material/Pagination';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchIcon from '@mui/icons-material/Search';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TodoCard, { type TodoItem } from '../components/todos/TodoCard';
import {
  fetchTodos,
  fetchTodoStats,
  createTodo,
  updateTodo,
  moveTodo,
  startTodo,
  completeTodo,
  cancelTodo,
  deleteTodo,
} from '../api/todos.api';

const priorities = ['Low', 'Medium', 'High'] as const;

const priorityLabels: Record<string, string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
};

type TodoStatus = 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';

// Board column definitions (Trello-style)
const columns: Array<{ key: TodoStatus; label: string; color: string }> = [
  { key: 'todo', label: 'Cần làm', color: '#5e6c84' },
  { key: 'in_progress', label: 'Đang làm', color: '#0c66e4' },
  { key: 'done', label: 'Hoàn thành', color: '#22a06b' },
  { key: 'overdue', label: 'Quá hạn', color: '#c9372c' },
  { key: 'cancelled', label: 'Đã hủy', color: '#e2780f' },
];

const DRAG_TARGETS: Record<TodoStatus, TodoStatus[]> = {
  todo: ['in_progress', 'done', 'cancelled'],
  in_progress: ['done', 'cancelled'],
  done: [],
  overdue: ['todo', 'cancelled'],
  cancelled: [],
};

// Optimistically reorder the flat todo list so the board updates instantly,
// without refetching the whole page. Handles both same-column reordering
// (up/down) and cross-column moves. `beforeTodoId` = insert before that card;
// omit it to append to the end of the target column.
function applyReorder(
  todos: TodoItem[],
  draggingId: number,
  targetStatus: TodoStatus,
  beforeTodoId?: number,
): TodoItem[] {
  const dragging = todos.find((todo) => todo.id === draggingId);
  if (!dragging) return todos;

  const column = todos
    .filter((todo) => todo.status === targetStatus && todo.id !== draggingId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);

  const movedItem: TodoItem = { ...dragging, status: targetStatus };

  let insertIndex = column.length;
  if (beforeTodoId != null) {
    const idx = column.findIndex((todo) => todo.id === beforeTodoId);
    if (idx !== -1) insertIndex = idx;
  }
  column.splice(insertIndex, 0, movedItem);

  const orderMap = new Map<number, number>();
  column.forEach((todo, index) => orderMap.set(todo.id, index + 1));

  return todos.map((todo) => {
    if (todo.id === draggingId) return { ...movedItem, sortOrder: orderMap.get(draggingId) };
    if (orderMap.has(todo.id)) return { ...todo, sortOrder: orderMap.get(todo.id)! };
    return todo;
  });
}

type BoardColumnProps = {
  column: { key: TodoStatus; label: string; color: string };
  items: TodoItem[];
  statusFilter: 'all' | TodoStatus;
  statCount: Record<TodoStatus, number>;
  draggingTodoId: number | null;
  dropTargetStatus: TodoStatus | null;
  dropTargetTodoId: number | null;
  draggingTodo: TodoItem | null;
  canDropHere: (targetStatus: TodoStatus) => boolean;
  onColumnDragOver: (targetStatus: TodoStatus, event: DragEvent<HTMLDivElement>) => void;
  onColumnDrop: (targetStatus: TodoStatus, event: DragEvent<HTMLDivElement>) => void;
  onCardDragStart: (event: DragEvent<HTMLDivElement>, todo: TodoItem) => void;
  onCardDragEnd: () => void;
  onCardDragOver: (event: DragEvent<HTMLDivElement>, todo: TodoItem) => void;
  onCardDrop: (event: DragEvent<HTMLDivElement>, todo: TodoItem) => void;
  onEdit: (todo: TodoItem) => void;
  onStart: (todo: TodoItem) => void;
  onComplete: (todo: TodoItem) => void;
  onCancel: (id: number) => void;
  onDelete: (id: number) => void;
};

const BoardColumn = memo(function BoardColumn({
  column,
  items,
  statusFilter,
  statCount,
  draggingTodoId,
  dropTargetStatus,
  dropTargetTodoId,
  draggingTodo,
  canDropHere,
  onColumnDragOver,
  onColumnDrop,
  onCardDragStart,
  onCardDragEnd,
  onCardDragOver,
  onCardDrop,
  onEdit,
  onStart,
  onComplete,
  onCancel,
  onDelete,
}: BoardColumnProps) {
  return (
    <Box
      onDragOver={(event) => {
        if (!draggingTodo || !canDropHere(column.key)) return;
        onColumnDragOver(column.key, event);
      }}
      onDrop={(event) => {
        onColumnDrop(column.key, event);
      }}
      sx={{
        flex: statusFilter === 'all' ? '0 0 300px' : '1 1 100%',
        minWidth: statusFilter === 'all' ? 300 : undefined,
        maxWidth: statusFilter === 'all' ? 320 : undefined,
        bgcolor: dropTargetStatus === column.key ? '#e9f2ff' : '#ebecf0',
        border: dropTargetStatus === column.key ? '1px solid #0c66e4' : '1px solid transparent',
        borderRadius: 2.5,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 320px)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          py: 1,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: column.color }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {column.label}
          </Typography>
        </Stack>
        <Chip
          label={statCount[column.key]}
          size="small"
          sx={{ bgcolor: 'rgba(9,30,66,0.08)', color: 'text.secondary', fontWeight: 700 }}
        />
      </Box>

      <Stack
        spacing={1}
        sx={{
          overflowY: 'auto',
          px: 0.5,
          pb: 0.5,
          flex: 1,
        }}
      >
        {items.length === 0 ? (
          <Box
            sx={{
              py: 3,
              textAlign: 'center',
              color: 'text.disabled',
              border: '2px dashed #dfe1e6',
              borderRadius: 2,
              m: 0.5,
            }}
          >
            <Typography variant="caption">Không có công việc</Typography>
          </Box>
        ) : (
          items.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              draggable
              isDragging={draggingTodoId === todo.id}
              isDropTarget={dropTargetTodoId === todo.id}
              onEdit={onEdit}
              onStart={onStart}
              onComplete={onComplete}
              onCancel={onCancel}
              onDelete={onDelete}
              onDragStart={onCardDragStart}
              onDragEnd={onCardDragEnd}
              onDragOver={onCardDragOver}
              onDrop={onCardDrop}
            />
          ))
        )}
      </Stack>
    </Box>
  );
}, (prev, next) =>
  prev.column === next.column &&
  prev.items === next.items &&
  prev.statusFilter === next.statusFilter &&
  prev.draggingTodoId === next.draggingTodoId &&
  prev.dropTargetStatus === next.dropTargetStatus &&
  prev.dropTargetTodoId === next.dropTargetTodoId &&
  prev.statCount[next.column.key] === next.statCount[next.column.key] &&
  prev.draggingTodo === next.draggingTodo,
);

type TodoForm = {
  title: string;
  description: string;
  priority: string;
  tags: string;
  dueDate: Dayjs | null;
};

const initialForm: TodoForm = {
  title: '',
  description: '',
  priority: 'Low',
  tags: '',
  dueDate: null,
};

export default function TodosPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | TodoStatus>('all');
  const [priority, setPriority] = useState('all');
  const [sortBy] = useState('sort_order');
  const [order, setOrder] = useState<'all' | 'asc' | 'desc'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TodoForm>(initialForm);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [cancelingTodoId, setCancelingTodoId] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [draggingTodoId, setDraggingTodoId] = useState<number | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<TodoStatus | null>(null);
  const [dropTargetTodoId, setDropTargetTodoId] = useState<number | null>(null);
  const [restoreTodoId, setRestoreTodoId] = useState<number | null>(null);
  const [stats, setStats] = useState({
    todo: 0,
    in_progress: 0,
    done: 0,
    overdue: 0,
    cancelled: 0,
  });

  const loadStats = () => {
    fetchTodoStats()
      .then(setStats)
      .catch(() => {
        /* stats optional on error */
      });
  };

  const loadTodos = () => {
    setLoading(true);
    setError(null);
    const params: Record<string, string | number> = {
      page,
      limit,
      status,
      sortBy,
    };
    if (order !== 'all') {
      params.order = order;
    }
    if (search.trim()) {
      params.search = search.trim();
    }
    if (priority !== 'all') {
      params.priority = priority;
    }

    fetchTodos(params)
      .then((data) => {
        console.log('Todos fetched:', data.items);
        setTodos(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((err) => {
        console.error('Error fetching todos:', err);
        setError('Không thể tải danh sách todo. Vui lòng thử lại.');
      })
      .finally(() => setLoading(false));
    loadStats();
  };

  useEffect(() => {
    loadTodos();
  }, [page, status, priority, sortBy, order, search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingTodo(null);
    setRestoreTodoId(null);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const parseTags = (raw: string) =>
    raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Tiêu đề là bắt buộc.');
      return;
    }

    if (restoreTodoId && !form.dueDate) {
      setError('Vui lòng chọn ngày đến hạn mới để đưa todo về Cần làm.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      dueDate: form.dueDate ? form.dueDate.format('YYYY-MM-DD') : null,
      tags: parseTags(form.tags),
    };

    try {
      const saved = editingTodo
        ? await updateTodo(editingTodo.id, payload)
        : await createTodo(payload);

      if (editingTodo) {
        setTodos((current) => current.map((todo) => (todo.id === saved.id ? saved : todo)));
      } else {
        setTodos((current) => [saved, ...current]);
        setTotal((prev) => prev + 1);
      }
      resetForm();
      setFormOpen(false);
      loadStats();
    } catch {
      setError('Không thể lưu todo. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (todo: TodoItem) => {
    setEditingTodo(todo);
    setRestoreTodoId(null);
    setForm({
      title: todo.title,
      description: todo.description ?? '',
      priority: todo.priority,
      tags: todo.tags.map((tag) => tag.name).join(', '),
      dueDate: todo.dueDate ? dayjs(todo.dueDate) : null,
    });
    setFormOpen(true);
  };

  // Starts a todo: transitions from 'todo' to 'in_progress'
  // After any status change, both summary and todo list must be
  // refreshed together to prevent display inconsistency.
  const handleStart = async (todo: TodoItem) => {
    setError(null);
    try {
      await startTodo(todo.id);
      // Refresh both the todo list and stats after action
      loadTodos(); // Refresh both the todo list and stats after action
    } catch {
      setError('Không thể bắt đầu todo.');
    }
  };

  // Completes a todo: transitions from 'todo' or 'in_progress' to 'done'
  // After any status change, both summary and todo list must be
  // refreshed together to prevent display inconsistency.
  const handleComplete = async (todo: TodoItem) => {
    setError(null);
    try {
      await completeTodo(todo.id);
      // Refresh both the todo list and stats after action
      loadTodos(); // Refresh both the todo list and stats after action
    } catch {
      setError('Không thể hoàn thành todo.');
    }
  };

  // Cancels a todo with required reason: transitions to 'cancelled'
  // After any status change, both summary and todo list must be
  // refreshed together to prevent display inconsistency.
  const handleCancelClick = (todoId: number) => {
    setError(null);
    setCancelingTodoId(todoId);
    setCancellationReason('');
  };

  const handleCancelConfirm = async () => {
    if (cancelingTodoId === null) return;

    if (cancellationReason.trim().length < 10) {
      setError('Lý do hủy phải có ít nhất 10 ký tự');
      return;
    }

    setError(null);
    try {
      await cancelTodo(cancelingTodoId, cancellationReason);
      // Refresh the todo list and stats after successful cancellation
      loadTodos();
      setCancelingTodoId(null);
      setCancellationReason('');
      clearDragState();
    } catch (error) {
      setError('Không thể hủy todo. Vui lòng thử lại.');
    }
  };

  const handleCancelCancel = () => {
    setCancelingTodoId(null);
    setCancellationReason('');
    clearDragState();
  };

  const handleRestoreOverdueTodo = (todo: TodoItem) => {
    setEditingTodo(todo);
    setRestoreTodoId(todo.id);
    setForm({
      title: todo.title,
      description: todo.description ?? '',
      priority: todo.priority,
      tags: todo.tags.map((tag) => tag.name).join(', '),
      dueDate: dayjs().add(1, 'day'),
    });
    setFormOpen(true);
  };

  const handleDelete = async (todoId: number) => {
    setError(null);
    try {
      await deleteTodo(todoId);
      setTodos((current) => current.filter((item) => item.id !== todoId));
      setTotal((prev) => Math.max(prev - 1, 0));
      loadStats();
    } catch {
      setError('Không thể xóa todo.');
    }
  };

  // Group the fetched todos into status columns for the board view
  const grouped = useMemo(() => {
    const map: Record<TodoStatus, TodoItem[]> = {
      todo: [],
      in_progress: [],
      done: [],
      overdue: [],
      cancelled: [],
    };
    todos.forEach((todo) => {
      if (map[todo.status]) map[todo.status].push(todo);
    });
    (Object.keys(map) as TodoStatus[]).forEach((key) => {
      map[key].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);
    });
    return map;
  }, [todos]);

  const visibleColumns = status === 'all' ? columns : columns.filter((c) => c.key === status);
  const statCount: Record<TodoStatus, number> = {
    todo: stats.todo,
    in_progress: stats.in_progress,
    done: stats.done,
    overdue: stats.overdue,
    cancelled: stats.cancelled,
  };
  const draggingTodo = draggingTodoId ? todos.find((todo) => todo.id === draggingTodoId) ?? null : null;

  const canDropHere = (targetStatus: TodoStatus) =>
    draggingTodo
      ? draggingTodo.status === targetStatus || DRAG_TARGETS[draggingTodo.status].includes(targetStatus)
      : false;

  const clearDragState = () => {
    setDraggingTodoId(null);
    setDropTargetStatus(null);
    setDropTargetTodoId(null);
  };

  const handleCardDragStart = (event: DragEvent<HTMLDivElement>, todo: TodoItem) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(todo.id));
    setDraggingTodoId(todo.id);
    setDropTargetStatus(null);
    setDropTargetTodoId(null);
  };

  const handleCardDragEnd = () => {
    clearDragState();
  };

  const handleDropToStatus = async (targetStatus: TodoStatus) => {
    if (!draggingTodo) return;

    if (!canDropHere(targetStatus)) {
      clearDragState();
      return;
    }

    setError(null);
    try {
      if (draggingTodo.status === 'overdue' && targetStatus === 'todo') {
        handleRestoreOverdueTodo(draggingTodo);
        clearDragState();
        return;
      }

      if (targetStatus === 'cancelled' && draggingTodo.status !== 'cancelled') {
        setCancelingTodoId(draggingTodo.id);
        setCancellationReason('');
        clearDragState();
        return;
      }

      // Dropping on empty column space appends to the end of that column.
      const movingId = draggingTodo.id;
      setTodos((current) => applyReorder(current, movingId, targetStatus));
      clearDragState();
      try {
        await moveTodo(movingId, { targetStatus });
        loadStats();
      } catch {
        setError('Không thể sắp xếp lại công việc. Vui lòng thử lại.');
        loadTodos();
      }
      return;
    } catch {
      setError('Không thể sắp xếp lại công việc. Vui lòng thử lại.');
    } finally {
      clearDragState();
    }
  };

  const handleDropToCard = async (targetTodo: TodoItem) => {
    if (!draggingTodo || draggingTodo.id === targetTodo.id) {
      clearDragState();
      return;
    }

    setError(null);
    try {
      if (draggingTodo.status === 'overdue' && targetTodo.status === 'todo') {
        handleRestoreOverdueTodo(draggingTodo);
        clearDragState();
        return;
      }

      // Optimistically reorder locally so only the affected cards move,
      // instead of refetching and re-rendering the whole board.
      const movingId = draggingTodo.id;
      const targetStatus = targetTodo.status;
      setTodos((current) => applyReorder(current, movingId, targetStatus, targetTodo.id));
      clearDragState();
      try {
        await moveTodo(movingId, {
          targetStatus,
          beforeTodoId: targetTodo.id,
        });
        loadStats();
      } catch {
        setError('Không thể sắp xếp lại công việc. Vui lòng thử lại.');
        loadTodos();
      }
      return;
    } catch {
      setError('Không thể sắp xếp lại công việc. Vui lòng thử lại.');
    } finally {
      clearDragState();
    }
  };

  const handleCardDragOver = (event: DragEvent<HTMLDivElement>, todo: TodoItem) => {
    if (!draggingTodo || draggingTodo.id === todo.id) return;
    if (!canDropHere(todo.status)) return;

    event.preventDefault();
    event.stopPropagation();
    setDropTargetStatus(todo.status);
    setDropTargetTodoId(todo.id);
  };

  const handleCardDrop = (event: DragEvent<HTMLDivElement>, todo: TodoItem) => {
    event.preventDefault();
    // Prevent the parent column's onDrop from also firing, which would
    // otherwise override the card-level position with a column append.
    event.stopPropagation();
    void handleDropToCard(todo);
  };

  const handleColumnDragOver = (targetStatus: TodoStatus, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDropTargetStatus(targetStatus);
    setDropTargetTodoId(null);
  };

  const handleColumnDrop = (targetStatus: TodoStatus, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    void handleDropToStatus(targetStatus);
  };

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4">Bảng công việc</Typography>
          
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          Thêm công việc
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {/* Filter toolbar */}
      <Paper sx={{ p: 2, borderRadius: 2.5 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              lg: '2fr 1fr 1fr 1fr ',
            },
          }}
        >
          <TextField
            fullWidth
            placeholder="Tìm kiếm công việc..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth size="small">
            <InputLabel id="status-filter-label">Trạng thái</InputLabel>
            <Select
              labelId="status-filter-label"
              label="Trạng thái"
              value={status}
              onChange={(event: SelectChangeEvent<string>) => {
                setStatus(event.target.value as 'all' | TodoStatus);
                setPage(1);
              }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="todo">Cần làm</MenuItem>
              <MenuItem value="in_progress">Đang làm</MenuItem>
              <MenuItem value="done">Hoàn thành</MenuItem>
              <MenuItem value="overdue">Quá hạn</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel id="priority-filter-label">Ưu tiên</InputLabel>
            <Select
              labelId="priority-filter-label"
              label="Ưu tiên"
              value={priority}
              onChange={(event: SelectChangeEvent<string>) => {
                setPriority(event.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {priorities.map((priorityOption) => (
                <MenuItem key={priorityOption} value={priorityOption}>
                  {priorityLabels[priorityOption] ?? priorityOption}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* <FormControl fullWidth size="small">
            <InputLabel id="sort-label">Sắp xếp</InputLabel>
            <Select
              labelId="sort-label"
              label="Sắp xếp"
              value={sortBy}
              onChange={(event: SelectChangeEvent<string>) => setSortBy(event.target.value)}
            >
              <MenuItem value="sort_order">Thứ tự kéo thả</MenuItem>
              <MenuItem value="due_date">Ngày đến hạn</MenuItem>
              <MenuItem value="priority">Ưu tiên</MenuItem>
              <MenuItem value="created_at">Mới nhất</MenuItem>
            </Select>
          </FormControl> */}
          <FormControl fullWidth size="small">
            <InputLabel id="order-label">Thứ tự</InputLabel>
            <Select
              labelId="order-label"
              label="Thứ tự"
              value={order}
              onChange={(event: SelectChangeEvent<'all' | 'asc' | 'desc'>) =>
                setOrder(event.target.value as 'all' | 'asc' | 'desc')
              }
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="asc">Tăng dần</MenuItem>
              <MenuItem value="desc">Giảm dần</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Board */}
      {loading ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 1,
            alignItems: 'flex-start',
          }}
        >
          {visibleColumns.map((col) => {
            return (
              <BoardColumn
                key={col.key}
                column={col}
                items={grouped[col.key]}
                statusFilter={status}
                statCount={statCount}
                draggingTodoId={draggingTodoId}
                dropTargetStatus={dropTargetStatus}
                dropTargetTodoId={dropTargetTodoId}
                draggingTodo={draggingTodo}
                canDropHere={canDropHere}
                onColumnDragOver={handleColumnDragOver}
                onColumnDrop={handleColumnDrop}
                onCardDragStart={handleCardDragStart}
                onCardDragEnd={handleCardDragEnd}
                onCardDragOver={handleCardDragOver}
                onCardDrop={handleCardDrop}
                onEdit={handleEdit}
                onStart={handleStart}
                onComplete={handleComplete}
                onCancel={handleCancelClick}
                onDelete={handleDelete}
              />
            );
          })}
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Trang {page} · Hiển thị {todos.length} / {total} công việc
        </Typography>
        <Pagination
          count={Math.max(Math.ceil(total / limit), 1)}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          shape="rounded"
        />
      </Box>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onClose={closeForm} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {restoreTodoId ? 'Đổi hạn để trả về Cần làm' : editingTodo ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {restoreTodoId ? (
              <Alert severity="info">
                Todo đang ở trạng thái quá hạn. Hãy đổi sang ngày đến hạn mới để đưa nó về cột Cần làm.
              </Alert>
            ) : null}
            <TextField
              label="Tiêu đề"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              fullWidth
              autoFocus
            />
            <TextField
              label="Mô tả"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              fullWidth
              multiline
              minRows={3}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Ngày đến hạn"
                value={form.dueDate}
                onChange={(newValue) => setForm((prev) => ({ ...prev, dueDate: newValue }))}
                minDate={dayjs()}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </LocalizationProvider>
            <FormControl fullWidth size="small">
              <InputLabel id="priority-label">Độ ưu tiên</InputLabel>
              <Select
                labelId="priority-label"
                label="Độ ưu tiên"
                value={form.priority}
                onChange={(event: SelectChangeEvent<string>) =>
                  setForm((prev) => ({ ...prev, priority: event.target.value }))
                }
              >
                {priorities.map((priorityOption) => (
                  <MenuItem key={priorityOption} value={priorityOption}>
                    {priorityLabels[priorityOption] ?? priorityOption}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Thẻ (phân tách bằng dấu phẩy)"
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeForm}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {restoreTodoId ? 'Đổi hạn & trả về' : editingTodo ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={cancelingTodoId !== null} onClose={handleCancelCancel} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Hủy công việc</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            Nhập lý do hủy (tối thiểu 10 ký tự):
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Lý do hủy..."
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            error={cancellationReason.length > 0 && cancellationReason.length < 10}
            helperText={
              cancellationReason.length > 0 && cancellationReason.length < 10
                ? `Cần ${10 - cancellationReason.length} ký tự nữa`
                : ''
            }
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCancelCancel}>Hủy bỏ</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelConfirm}
            disabled={cancellationReason.trim().length < 10}
          >
            Xác nhận hủy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
