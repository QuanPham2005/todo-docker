import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BanCheckGuard } from '../auth/guards/ban-check.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { QueryTodoDto } from '../todos/dto/query-todo.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

@UseGuards(JwtAuthGuard, BanCheckGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(@Query() query: QueryUserDto) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/ban')
  async banUser(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BanUserDto,
  ) {
    return this.adminService.setBanStatus(id, dto.isBanned, currentUser.id);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteUser(id);
    return { message: 'Người dùng đã được xoá' };
  }

  @Get('todos')
  async getTodos(@Query() query: QueryTodoDto) {
    return this.adminService.getTodos(query);
  }

  @Delete('todos/:id')
  async deleteTodo(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteTodo(id);
    return { message: 'Todo đã được xoá' };
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getOverview();
  }

  @Get('stats/users')
  async getUserStats() {
    return this.adminService.getUserStats();
  }
}
