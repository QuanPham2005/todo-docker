import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Todo } from './entities/todo.entity';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

/** Phase 3: CRUD /todos */
@Module({
  imports: [TypeOrmModule.forFeature([Todo, Tag])],
  controllers: [TodosController],
  providers: [TodosService],
  exports: [TodosService, TypeOrmModule],
})
export class TodosModule {}
