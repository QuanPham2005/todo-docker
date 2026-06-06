import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../todos/entities/todo.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { QueryTodoDto } from '../todos/dto/query-todo.dto';
import { QueryUserDto } from './dto/query-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
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

    if (query.status && query.status !== 'all') {
      if (query.status === 'completed') {
        qb.andWhere(
          '(todo.status = :status OR todo.completed = true)',
          { status: query.status },
        );
      } else if (query.status === 'pending') {
        qb.andWhere(
          '((todo.status = :status AND (todo.due_date IS NULL OR todo.due_date::date >= CURRENT_DATE)) OR (todo.status IS NULL AND todo.completed = false AND (todo.due_date IS NULL OR todo.due_date::date >= CURRENT_DATE)))',
          { status: query.status },
        );
      } else if (query.status === 'overdue') {
        qb.andWhere(
          '((todo.status = :status) OR ((todo.status = :pending OR todo.status IS NULL) AND todo.completed = false AND todo.due_date::date < CURRENT_DATE))',
          { status: query.status, pending: 'pending' },
        );
      }
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
    const completedTodos = await this.todosRepository.count({
      where: [
        { status: 'completed' },
        { completed: true },
      ],
    });
    const pendingTodos = await this.todosRepository
      .createQueryBuilder('todo')
      .where(
        '((todo.status = :status AND (todo.due_date IS NULL OR todo.due_date::date >= CURRENT_DATE)) OR (todo.status IS NULL AND todo.completed = false AND (todo.due_date IS NULL OR todo.due_date::date >= CURRENT_DATE)))',
        { status: 'pending' },
      )
      .getCount();
    const overdueTodos = await this.todosRepository
      .createQueryBuilder('todo')
      .where(
        '((todo.status = :status) OR ((todo.status = :pending OR todo.status IS NULL) AND todo.completed = false AND todo.due_date::date < CURRENT_DATE))',
        { status: 'overdue', pending: 'pending' },
      )
      .getCount();

    return {
      totalUsers,
      totalAdmins,
      totalTodos,
      completedTodos,
      pendingTodos,
      overdueTodos,
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
        const completed = await this.todosRepository
          .createQueryBuilder('todo')
          .where('todo.user_id = :userId', { userId: user.id })
          .andWhere('(todo.status = :status OR todo.completed = true)', {
            status: 'completed',
          })
          .getCount();
        const pending = await this.todosRepository
          .createQueryBuilder('todo')
          .where('todo.user_id = :userId', { userId: user.id })
          .andWhere(
            '((todo.status = :status AND (todo.due_date IS NULL OR todo.due_date::date >= CURRENT_DATE)) OR (todo.status IS NULL AND todo.completed = false AND (todo.due_date IS NULL OR todo.due_date::date >= CURRENT_DATE)))',
            { status: 'pending' },
          )
          .getCount();
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          isBanned: user.isBanned,
          totalTodos: total,
          completedTodos: completed,
          pendingTodos: pending,
          completionRate,
        };
      }),
    );

    return stats;
  }
}
