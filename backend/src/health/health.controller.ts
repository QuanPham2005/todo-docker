import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TodosService } from '../todos/todos.service';
import { UsersService } from '../users/users.service';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly todosService: TodosService,
  ) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'todo-app-backend',
      phase: 1,
    };
  }

  @Get('db')
  async getDbHealth() {
    await this.dataSource.query('SELECT 1');
    const [users, todos] = await Promise.all([
      this.usersService.count(),
      this.todosService.count(),
    ]);
    return {
      status: 'ok',
      database: 'connected',
      tables: { users, todos },
    };
  }
}
