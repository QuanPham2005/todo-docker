import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TodosService } from './todos/todos.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get TodosService to set up scheduled job
  const todosService = app.get(TodosService);

  // Mark overdue todos immediately on startup
  try {
    const count = await todosService.markOverdueTodosIfNeeded();
    console.log(`Marked ${count} todos as overdue on startup`);
  } catch (error) {
    console.error('Error marking overdue todos on startup:', error);
  }


  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
