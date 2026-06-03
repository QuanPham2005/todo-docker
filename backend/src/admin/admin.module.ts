import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Todo } from '../todos/entities/todo.entity';
import { User } from '../users/entities/user.entity';
import { TodosModule } from '../todos/todos.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Todo]),
    UsersModule,
    TodosModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
