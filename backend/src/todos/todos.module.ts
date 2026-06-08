import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Todo } from './entities/todo.entity';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

/**
 * Todos Module
 * - Handles CRUD operations for todos
 * - Provides action endpoints: start, complete, cancel
 * - Includes markOverdueTodosIfNeeded() method for external cron scheduling
 */
@Module({
  imports: [TypeOrmModule.forFeature([Todo, Tag])],
  controllers: [TodosController],
  providers: [TodosService],
  exports: [TodosService, TypeOrmModule],
})
export class TodosModule {}
