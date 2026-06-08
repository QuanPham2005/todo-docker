import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { CancelTodoDto } from './dto/cancel-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BanCheckGuard } from '../auth/guards/ban-check.guard';
import { FutureDatePipe } from '../common/pipes/future-date.pipe';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, BanCheckGuard)
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  async findAll(@CurrentUser() user: User, @Query() query: QueryTodoDto) {
    return this.todosService.findAllForUser(user, query);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: User) {
    return this.todosService.getStatusSummaryForUser(user.id);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.todosService.findOneForUser(id, user);
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body(new FutureDatePipe()) dto: CreateTodoDto,
  ) {
    return this.todosService.create(user, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body(new FutureDatePipe()) dto: UpdateTodoDto,
  ) {
    return this.todosService.update(id, user, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.todosService.remove(id, user);
    return { message: 'Todo đã được xoá' };
  }

  @Patch(':id/start')
  async start(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.todosService.startTodo(id, user);
  }

  @Patch(':id/complete')
  async complete(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.todosService.completeTodo(id, user);
  }

  @Patch(':id/cancel')
  async cancel(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelTodoDto,
  ) {
    return this.todosService.cancelTodo(id, user, dto.reason);
  }
}
