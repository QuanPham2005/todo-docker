import { Module } from '@nestjs/common';
import { TodosModule } from '../todos/todos.module';
import { UsersModule } from '../users/users.module';
import { HealthController } from './health.controller';

@Module({
  imports: [UsersModule, TodosModule],
  controllers: [HealthController],
})
export class HealthModule {}
