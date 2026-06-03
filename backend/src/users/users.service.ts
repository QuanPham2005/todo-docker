import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(email: string, passwordHash: string): Promise<User> {
    const user = this.usersRepository.create({
      email,
      passwordHash,
      role: UserRole.USER,
      isBanned: false,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async count(search?: string): Promise<number> {
    const qb = this.usersRepository.createQueryBuilder('user');
    if (search) {
      qb.where('user.email ILIKE :search', {
        search: `%${search}%`,
      });
    }
    return qb.getCount();
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ items: User[]; total: number; page: number; limit: number }> {
    const qb = this.usersRepository.createQueryBuilder('user');
    if (search) {
      qb.where('user.email ILIKE :search', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('user.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async setBanStatus(id: number, isBanned: boolean): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    user.isBanned = isBanned;
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
  }
}
