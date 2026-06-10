import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Todo } from './entities/todo.entity';
import { Tag } from './entities/tag.entity';
import { User } from '../users/entities/user.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

// Status constants — single source of truth for all status values
type TodoStatus = 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';

const TODO_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

// Defines which transitions are valid from each status — no other transitions allowed
const VALID_TRANSITIONS: Record<TodoStatus, TodoStatus[]> = {
  todo: [TODO_STATUS.IN_PROGRESS, TODO_STATUS.DONE, TODO_STATUS.CANCELLED],
  in_progress: [TODO_STATUS.DONE, TODO_STATUS.CANCELLED, TODO_STATUS.OVERDUE],
  overdue: [TODO_STATUS.CANCELLED],
  done: [],
  cancelled: [],
};

// Min length for cancellation reason to ensure user provides meaningful explanation
const MIN_CANCELLATION_REASON_LENGTH = 10;

// Statuses that can automatically transition to 'overdue' (cron job only)
// A todo is overdue if it is still todo or in_progress after its due date.
const STATUSES_THAT_CAN_EXPIRE: TodoStatus[] = [TODO_STATUS.TODO, TODO_STATUS.IN_PROGRESS];

// Helper: Check if transition is valid
function isValidTransition(from: TodoStatus, to: TodoStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

// Helper: Get error message for invalid transition
function getTransitionErrorMessage(from: TodoStatus, to: TodoStatus): string {
  const validOptions = VALID_TRANSITIONS[from].join(', ') || 'no transitions';
  return `Cannot transition from '${from}' to '${to}'. Valid transitions: ${validOptions}`;
}

const DEFAULT_SORT_ORDER = 0;

@Injectable()
export class TodosService {
  @Cron(CronExpression.EVERY_MINUTE)
  async handleOverdueTodosCron() {
    const count = await this.markOverdueTodosIfNeeded();
    if (count > 0) {
      console.log(`Marked ${count} todos as overdue in scheduled job`);
    }
  }
  constructor(
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * PRIVATE: Returns the initial status for a new todo.
   * All todos start in 'todo' state regardless of whether they have a deadline.
   */
  private getInitialStatus(): TodoStatus {
    return TODO_STATUS.TODO;
  }

  /**
   * PRIVATE: Validates that a transition between two statuses is allowed.
   * Throws BadRequestException if the transition is invalid.
   */
  private validateTransition(
    currentStatus: TodoStatus,
    nextStatus: TodoStatus,
    actionName?: string,
  ): void {
    if (!isValidTransition(currentStatus, nextStatus)) {
      const errorMessage = getTransitionErrorMessage(currentStatus, nextStatus);
      throw new BadRequestException(errorMessage);
    }
  }

  private async getNextSortOrder(userId: number, status: TodoStatus): Promise<number> {
    const result = await this.todosRepository
      .createQueryBuilder('todo')
      .select('COALESCE(MAX(todo.sort_order), 0)', 'max')
      .where('todo.user_id = :userId', { userId })
      .andWhere('todo.status = :status', { status })
      .getRawOne<{ max: string }>();

    return Number(result?.max ?? DEFAULT_SORT_ORDER) + 1;
  }

  private async loadOrderedTodos(
    userId: number,
    status: TodoStatus,
    manager = this.todosRepository.manager,
  ) {
    return manager.getRepository(Todo).find({
      where: { userId, status },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  private async renumberTodos(
    manager: Pick<Repository<Todo>, 'save'>,
    todos: Todo[],
    status?: TodoStatus,
  ) {
    todos.forEach((todo, index) => {
      todo.sortOrder = index + 1;
      if (status) {
        todo.status = status;
      }
    });

    await manager.save(todos);
  }

  private async moveTodoToPosition(
    user: User,
    id: number,
    targetStatus: TodoStatus,
    beforeTodoId?: number,
  ): Promise<Todo> {
    return this.todosRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Todo);
      const todo = await repo.findOne({
        where: { id, userId: user.id },
        relations: { tags: true },
      });

      if (!todo) {
        throw new NotFoundException('Todo không tồn tại');
      }

      const sourceStatus = todo.status;
      const sourceTodos = await this.loadOrderedTodos(user.id, sourceStatus, manager);
      const sourceRemaining = sourceTodos.filter((item) => item.id !== todo.id);

      if (sourceStatus === targetStatus) {
        if (beforeTodoId === todo.id) {
          return todo;
        }

        const reordered = [...sourceRemaining];
        const insertIndex = beforeTodoId
          ? reordered.findIndex((item) => item.id === beforeTodoId)
          : reordered.length;

        if (insertIndex >= 0 && insertIndex < reordered.length) {
          reordered.splice(insertIndex, 0, todo);
        } else {
          reordered.push(todo);
        }

        await this.renumberTodos(repo, reordered, targetStatus);
        return repo.findOneOrFail({
          where: { id: todo.id },
          relations: { tags: true },
        });
      }

      const targetTodos = await this.loadOrderedTodos(user.id, targetStatus, manager);
      const reorderedTarget = [...targetTodos];
      const insertIndex = beforeTodoId
        ? reorderedTarget.findIndex((item) => item.id === beforeTodoId)
        : reorderedTarget.length;

      todo.status = targetStatus;
      if (insertIndex >= 0 && insertIndex < reorderedTarget.length) {
        reorderedTarget.splice(insertIndex, 0, todo);
      } else {
        reorderedTarget.push(todo);
      }

      await this.renumberTodos(repo, sourceRemaining);
      await this.renumberTodos(repo, reorderedTarget, targetStatus);

      return repo.findOneOrFail({
        where: { id: todo.id },
        relations: { tags: true },
      });
    });
  }

  /**
   * PUBLIC: Creates a new todo for a user.
   * The todo always starts in 'todo' state and inherits its tags.
   */
  async create(user: User, dto: CreateTodoDto) {
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    const todo = this.todosRepository.create({
      userId: user.id,
      title: dto.title,
      description: dto.description ?? null,
      dueDate,
      priority: dto.priority ?? 'Low',
      status: this.getInitialStatus(),
      sortOrder: await this.getNextSortOrder(user.id, this.getInitialStatus()),
    });

    const saved = await this.todosRepository.save(todo);

    if (dto.tags && dto.tags.length) {
      const tags = dto.tags.map((name) =>
        this.tagRepository.create({
          name,
          todo: saved,
          todoId: saved.id,
        }),
      );
      await this.tagRepository.save(tags);
    }

    return this.findOneById(saved.id);
  }

  /**
   * PUBLIC: Starts a todo, transitioning it from 'todo' to 'in_progress'.
   * Only todos in 'todo' state can be started.
   */
  async startTodo(id: number, user: User): Promise<Todo> {
    this.validateTransition((await this.findOneForUser(id, user)).status, TODO_STATUS.IN_PROGRESS, 'startTodo');
    return this.moveTodoToPosition(user, id, TODO_STATUS.IN_PROGRESS);
  }

  /**
   * PUBLIC: Completes a todo, transitioning it to 'done'.
   * Todos in 'todo' or 'in_progress' state can be completed.
   */
  async completeTodo(id: number, user: User): Promise<Todo> {
    this.validateTransition((await this.findOneForUser(id, user)).status, TODO_STATUS.DONE, 'completeTodo');
    return this.moveTodoToPosition(user, id, TODO_STATUS.DONE);
  }

  /**
   * PUBLIC: Cancels a todo with a required reason.
   * Todos in 'todo', 'in_progress', or 'overdue' state can be cancelled.
   * Reason must be provided and will be stored for audit purposes.
   */
  async cancelTodo(
    id: number,
    user: User,
    reason?: string,
  ): Promise<Todo> {
    const todo = await this.findOneForUser(id, user);
    this.validateTransition(todo.status, TODO_STATUS.CANCELLED, 'cancelTodo');
    
    // Cancelled tasks require a reason — this is validated by the DTO
    // but we double-check here for safety
    if (!reason || reason.trim().length < MIN_CANCELLATION_REASON_LENGTH) {
      throw new BadRequestException(
        `Cancellation reason is required and must be at least ${MIN_CANCELLATION_REASON_LENGTH} characters`,
      );
    }
    
    const updated = await this.moveTodoToPosition(user, id, TODO_STATUS.CANCELLED);
    updated.cancellationReason = reason.trim();
    await this.todosRepository.save(updated);
    const refreshed = await this.findOneById(updated.id);
    if (!refreshed) throw new NotFoundException('Todo not found after update');
    return refreshed;
  }

  async move(
    id: number,
    user: User,
    targetStatus?: TodoStatus,
    beforeTodoId?: number,
  ): Promise<Todo> {
    const todo = await this.findOneForUser(id, user);
    return this.moveTodoToPosition(user, todo.id, targetStatus ?? todo.status, beforeTodoId);
  }

  /**
   * PUBLIC: Fetches all todos for a user with pagination and filtering.
   * Supports filtering by status, priority, and search term.
   */
  async findAllForUser(user: User, query: QueryTodoDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;

    const qb = this.todosRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.tags', 'tag')
      .where('todo.user_id = :userId', { userId: user.id });

    // Filter by status using new 5-state system
    if (query.status && query.status !== 'all') {
      qb.andWhere('todo.status = :status', { status: query.status });
    }

    if (query.priority) {
      qb.andWhere('todo.priority = :priority', { priority: query.priority });
    }

    if (query.search) {
      qb.andWhere('todo.title ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    const sortColumn =
      query.sortBy === 'created_at'
        ? 'todo.created_at'
        : query.sortBy === 'priority'
          ? 'todo.priority'
          : query.sortBy === 'due_date'
            ? 'todo.due_date'
            : 'todo.sort_order';

    qb.orderBy(sortColumn, sortColumn === 'todo.sort_order' ? 'ASC' : query.order ?? 'ASC')
      .addOrderBy('todo.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * PUBLIC: Fetches a single todo by ID.
   */
  async findOneById(id: number) {
    return this.todosRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
  }

  /**
   * PUBLIC: Fetches a single todo by ID and verifies it belongs to the user.
   */
  async findOneForUser(id: number, user: User) {
    const todo = await this.todosRepository.findOne({
      where: { id, userId: user.id },
      relations: { tags: true },
    });

    if (!todo) {
      throw new NotFoundException('Todo không tồn tại');
    }

    return todo;
  }

  /**
   * PUBLIC: Updates a todo's mutable fields (title, description, dueDate, priority, tags).
   * Status can only change through dedicated action endpoints (start, complete, cancel).
   */
  async update(id: number, user: User, dto: UpdateTodoDto) {
    const todo = await this.findOneForUser(id, user);
    const previousStatus = todo.status;

    if (dto.title !== undefined) {
      todo.title = dto.title;
    }
    if (dto.description !== undefined) {
      todo.description = dto.description;
    }
    if (dto.dueDate !== undefined) {
      todo.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.priority !== undefined) {
      todo.priority = dto.priority;
    }

    const shouldRestoreOverdueToTodo =
      previousStatus === TODO_STATUS.OVERDUE &&
      dto.dueDate !== undefined &&
      dto.dueDate !== null;

    if (shouldRestoreOverdueToTodo) {
      todo.status = TODO_STATUS.TODO;
    }

    if (dto.tags !== undefined) {
      await this.tagRepository.delete({ todoId: todo.id });
      todo.tags = [];
      if (dto.tags.length) {
        const tags = dto.tags.map((name) =>
          this.tagRepository.create({
            name,
            todo,
            todoId: todo.id,
          }),
        );
        todo.tags = await this.tagRepository.save(tags);
      }
    }

    await this.todosRepository.save(todo);
    return this.findOneById(todo.id);
  }

  /**
   * PUBLIC: Deletes a todo permanently.
   */
  async remove(id: number, user: User) {
    const result = await this.todosRepository.delete({ id, userId: user.id });
    if (result.affected === 0) {
      throw new NotFoundException('Todo không tồn tại');
    }
  }

  /**
   * PUBLIC: Returns the total count of all todos in the database.
   */
  async count(): Promise<number> {
    return this.todosRepository.count();
  }

  /**
   * PUBLIC: Returns per-status counts for the current user (all 5 keys, default 0).
   */
  async getStatusSummaryForUser(userId: number) {
    const rows = await this.todosRepository
      .createQueryBuilder('todo')
      .select('todo.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('todo.user_id = :userId', { userId })
      .groupBy('todo.status')
      .getRawMany<{ status: TodoStatus; count: string }>();

    const summary = {
      todo: 0,
      in_progress: 0,
      done: 0,
      overdue: 0,
      cancelled: 0,
    };

    for (const row of rows) {
      if (row.status in summary) {
        summary[row.status] = parseInt(row.count, 10);
      }
    }

    return summary;
  }

  /**
   * PUBLIC: Marks todos as overdue if their deadline has passed.
   * Only affects todos in 'in_progress' — 'todo' stays until user starts work.
   * done and cancelled are never changed.
   */
  async markOverdueTodosIfNeeded(): Promise<number> {
    const now = new Date();

    const todosToMarkOverdue = await this.todosRepository.find({
      where: STATUSES_THAT_CAN_EXPIRE.map((status) => ({
        status,
        dueDate: LessThan(now),
      })),
    });

    if (todosToMarkOverdue.length === 0) {
      return 0;
    }

    // Use In() operator for proper TypeORM syntax with array of IDs
    await this.todosRepository.update(
      { id: In(todosToMarkOverdue.map((t) => t.id)) },
      { status: TODO_STATUS.OVERDUE },
    );

    return todosToMarkOverdue.length;
  }
}
