import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Any, Repository } from 'typeorm';
import { Todo } from './entities/todo.entity';
import { Tag } from './entities/tag.entity';
import { User } from '../users/entities/user.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async create(user: User, dto: CreateTodoDto) {
    const todo = this.todosRepository.create({
      userId: user.id,
      title: dto.title,
      description: dto.description ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      priority: dto.priority ?? 'Low',
      completed: false,
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

  async findAllForUser(user: User, query: QueryTodoDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;

    const qb = this.todosRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.tags', 'tag')
      .where('todo.user_id = :userId', { userId: user.id });

    if (query.status && query.status !== 'all') {
      qb.andWhere(
        'todo.completed = :completed',
        { completed: query.status === 'completed' },
      );
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
      query.sortBy === 'created_at' ? 'todo.createdAt'
      : query.sortBy === 'priority' ? 'todo.priority'
      : 'todo.dueDate';

    qb.orderBy(sortColumn, query.order ?? 'ASC');

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

  async findOneById(id: number) {
    return this.todosRepository.findOne({
      where: { id },
      relations: { tags: true },
    });
  }

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
    if (dto.completed !== undefined) {
      todo.completed = dto.completed;
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

  async remove(id: number, user: User) {
    const result = await this.todosRepository.delete({ id, userId: user.id });
    if (result.affected === 0) {
      throw new NotFoundException('Todo không tồn tại');
    }
  }

  async count(): Promise<number> {
    return this.todosRepository.count();
  }

  async toggleCompleted(id: number, user: User) {
    const todo = await this.findOneForUser(id, user);
    todo.completed = !todo.completed;
    await this.todosRepository.save(todo);
    return todo;
  }
}
