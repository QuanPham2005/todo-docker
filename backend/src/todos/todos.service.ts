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
  todo: [TODO_STATUS.IN_PROGRESS, TODO_STATUS.DONE, TODO_STATUS.CANCELLED, TODO_STATUS.OVERDUE],
  in_progress: [TODO_STATUS.DONE, TODO_STATUS.CANCELLED, TODO_STATUS.OVERDUE],
  overdue: [TODO_STATUS.CANCELLED],
  done: [],
  cancelled: [],
};

// Min length for cancellation reason to ensure user provides meaningful explanation
const MIN_CANCELLATION_REASON_LENGTH = 10;

// Statuses that can automatically transition to 'overdue'
  // Only in_progress todos can become overdue when deadline passes.
  // todo (not started) stays as todo, done/cancelled are final states.
const STATUSES_THAT_CAN_EXPIRE = [TODO_STATUS.IN_PROGRESS];

// Helper: Check if transition is valid
function isValidTransition(from: TodoStatus, to: TodoStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

// Helper: Get error message for invalid transition
function getTransitionErrorMessage(from: TodoStatus, to: TodoStatus): string {
  const validOptions = VALID_TRANSITIONS[from].join(', ') || 'no transitions';
  return `Cannot transition from '${from}' to '${to}'. Valid transitions: ${validOptions}`;
}

@Injectable()
export class TodosService {
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
    const todo = await this.findOneForUser(id, user);
    this.validateTransition(todo.status, TODO_STATUS.IN_PROGRESS, 'startTodo');
    todo.status = TODO_STATUS.IN_PROGRESS;
    await this.todosRepository.save(todo);
    const updated = await this.findOneById(todo.id);
    if (!updated) throw new NotFoundException('Todo not found after update');
    return updated;
  }

  /**
   * PUBLIC: Completes a todo, transitioning it to 'done'.
   * Todos in 'todo' or 'in_progress' state can be completed.
   */
  async completeTodo(id: number, user: User): Promise<Todo> {
    const todo = await this.findOneForUser(id, user);
    this.validateTransition(todo.status, TODO_STATUS.DONE, 'completeTodo');
    todo.status = TODO_STATUS.DONE;
    await this.todosRepository.save(todo);
    const updated = await this.findOneById(todo.id);
    if (!updated) throw new NotFoundException('Todo not found after update');
    return updated;
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
    
    todo.status = TODO_STATUS.CANCELLED;
    todo.cancellationReason = reason.trim();
    await this.todosRepository.save(todo);
    const updated = await this.findOneById(todo.id);
    if (!updated) throw new NotFoundException('Todo not found after update');
    return updated;
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
          : 'todo.due_date';

    qb.orderBy(sortColumn, query.order ?? 'ASC')
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
   * PUBLIC: Marks todos as overdue if their deadline has passed.
   * Called periodically to keep overdue status up-to-date.
   * Only affects todos in 'todo' or 'in_progress' states.
   * Cancelled and done tasks are never changed.
   */
  async markOverdueTodosIfNeeded(): Promise<number> {
    const now = new Date();

    // Only in_progress todos become overdue when deadline passes.
  // todo, done, and cancelled are never touched by this job.
  const todosToMarkOverdue = await this.todosRepository.find({
    where: {
      status: TODO_STATUS.IN_PROGRESS,
      dueDate: LessThan(now),
    },
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
