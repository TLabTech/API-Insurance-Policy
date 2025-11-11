import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(
    paginationQuery: PaginationQueryDto,
    roleID?: string,
    search?: string,
  ): Promise<PaginatedResponse<User>> {
    const page = Number(paginationQuery.page) || 1;
    const limit = Number(paginationQuery.limit) || 10;
    const skip = (page - 1) * limit;

    // Tipe eksplisit agar aman
    let where: FindOptionsWhere<User>[] | FindOptionsWhere<User> | undefined;

    if (search) {
      const baseConditions: FindOptionsWhere<User>[] = [
        { email: ILike(`%${search}%`) },
        { firstName: ILike(`%${search}%`) },
        { lastName: ILike(`%${search}%`) },
      ];

      where = roleID
        ? baseConditions.map(
            (condition) =>
              ({
                ...condition,
                role: { id: Number.parseInt(roleID) },
              }) as FindOptionsWhere<User>,
          )
        : baseConditions;
    } else if (roleID) {
      where = {
        role: { id: Number.parseInt(roleID) },
      } as FindOptionsWhere<User>;
    }

    const [data, total_data] = await this.userRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { id: 'DESC' },
      relations: { role: true },
    });

    const total_page = Math.ceil(total_data / limit);

    return {
      total_data,
      current_page: page,
      total_page,
      limit,
      data,
    };
  }

  async findOne(id: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        role: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOneWithPassword(id: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'password',
        'isActive',
        'roleID',
        'branchID',
        'createdAt',
        'updatedAt',
      ],
      relations: {
        role: true,
      },
    });
    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: {
        role: true,
      },
    });
    return user || null;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'password',
        'isActive',
        'roleID',
        'branchID',
        'createdAt',
        'updatedAt',
      ],
      relations: {
        role: true,
      },
    });
    return user || null;
  }

  async create(userData: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    // Return the user with relations (but without password)
    const userWithRole = await this.findOne(savedUser.id);
    return userWithRole!;
  }

  async update(id: number, userData: UpdateUserDto): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If email is being updated, check for conflicts
    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }
    }

    // For password updates, create and save entity to trigger hashing
    if (userData.password) {
      const userEntity = await this.userRepository.findOne({ where: { id } });
      if (userEntity) {
        Object.assign(userEntity, userData);
        await this.userRepository.save(userEntity);
      }
    } else {
      await this.userRepository.update(id, userData);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.delete(id);
  }

  async validateUserPassword(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByEmailWithPassword(email);
    if (user && (await user.comparePassword(password))) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return null;
  }
}
