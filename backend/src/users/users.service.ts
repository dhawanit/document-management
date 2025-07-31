import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async findAll(page = 1, limit = 10, search?: string) {
    const whereConditions: any = {
      role: In([UserRole.EDITOR, UserRole.VIEWER]), // Exclude admin users
    };

    if (search) {
      whereConditions.email = Like(`%${search}%`); // Filter by email substring
    }

    const [result, total] = await this.userRepo.findAndCount({
      where: whereConditions,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'role', 'canTriggerIngestion', 'createdAt'],
    });

    return {
      data: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    user.role = role;
    return this.userRepo.save(user);
  }

  async updatePermissions(id: string, canTriggerIngestion: boolean): Promise<User> {
    const user = await this.findById(id);
    user.canTriggerIngestion = canTriggerIngestion;
    return this.userRepo.save(user);
  }
}