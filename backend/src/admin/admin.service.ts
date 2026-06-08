import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../todos/entities/todo.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { QueryTodoDto } from '../todos/dto/query-todo.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { TodosService } from '../todos/todos.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
    private readonly todosService: TodosService,
  ) {}

  async getUsers(query: QueryUserDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;

    const qb = this.usersRepository.createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.USER });

    if (query.search) {
      qb.andWhere('user.email ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('user.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        isBanned: user.isBanned,
        createdAt: user.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async setBanStatus(id: number, isBanned: boolean, currentUserId?: number) {
    if (currentUserId && id === currentUserId) {
      throw new BadRequestException('Không thể ban chính mình');
    }

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    user.isBanned = isBanned;
    return this.usersRepository.save(user);
  }

  async deleteUser(id: number) {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
  }

  async getTodos(query: QueryTodoDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;

    const qb = this.todosRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.tags', 'tag')
      .leftJoinAndSelect('todo.user', 'user');

    // Filter by status using new 5-state system
    if (query.status && query.status !== 'all') {
      qb.andWhere('todo.status = :status', { status: query.status });
    }

    if (query.priority) {
      qb.andWhere('todo.priority = :priority', {
        priority: query.priority,
      });
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

    qb.orderBy(sortColumn, query.order ?? 'ASC');
    qb.skip((page - 1) * limit).take(limit).distinct(true);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async deleteTodo(id: number) {
    const result = await this.todosRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Todo không tồn tại');
    }
  }

  async getOverview() {
    const totalUsers = await this.usersRepository.count({
      where: { role: UserRole.USER },
    });
    const totalAdmins = await this.usersRepository.count({
      where: { role: UserRole.ADMIN },
    });
    const totalTodos = await this.todosRepository.count();

    // First ensure any due todos are marked overdue
    await this.todosService.markOverdueTodosIfNeeded();

    // Returns count per status in a single query for performance.
    // All 5 statuses are always present in the response (default 0 if none).
    const statusCounts = await this.todosRepository
      .createQueryBuilder('todo')
      .select('todo.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('todo.status')
      .getRawMany();

    // Initialize with all statuses set to 0
    const DEFAULT_SUMMARY = {
      todo: 0,
      in_progress: 0,
      done: 0,
      overdue: 0,
      cancelled: 0,
    };

    // Map the query result to the expected format
    const statusSummary = statusCounts.reduce((acc, { status, count }) => {
      acc[status] = parseInt(count, 10);
      return acc;
    }, DEFAULT_SUMMARY);

    return {
      totalUsers,
      totalAdmins,
      totalTodos,
      ...statusSummary,
    };
  }

  async getUserStats() {
    const users = await this.usersRepository.find({
      where: { role: UserRole.USER },
    });
    const stats = await Promise.all(
      users.map(async (user) => {
        const total = await this.todosRepository.count({
          where: { userId: user.id },
        });
        const completed = await this.todosRepository.count({
          where: { userId: user.id, status: 'done' },
        });
        const todo = await this.todosRepository.count({
          where: { userId: user.id, status: 'todo' },
        });
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          isBanned: user.isBanned,
          totalTodos: total,
          completedTodos: completed,
          todoTodos: todo,
          completionRate,
        };
      }),
    );

    return stats;
  }
}
