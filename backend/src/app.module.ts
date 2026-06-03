import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { Tag } from './todos/entities/tag.entity';
import { Todo } from './todos/entities/todo.entity';
import { TodosModule } from './todos/todos.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },   
        entities: [User, Todo, Tag],
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    UsersModule,
    TodosModule,
    AuthModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
