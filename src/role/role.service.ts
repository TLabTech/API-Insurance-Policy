import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { User } from '../user/user.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Role>> {
    const page = Number(paginationQuery.page) || 1;
    const limit = Number(paginationQuery.limit) || 10;
    const skip = (page - 1) * limit;

    const [data, total_data] = await this.roleRepository.findAndCount({
      skip,
      take: limit,
      order: {
        id: 'DESC',
      },
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

  async create(roleData: CreateRoleDto) {
    const role = this.roleRepository.create(roleData);
    return this.roleRepository.save(role);
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: number, updateData: Partial<CreateRoleDto>): Promise<Role> {
    const updatedRole: Partial<Role> = {};

    // Handle each field update
    if (updateData.name !== undefined) {
      updatedRole.name = updateData.name;
    }

    await this.roleRepository.update(id, updatedRole);
    return this.findOne(id);
  }
  async remove(id: number): Promise<void> {
    await this.roleRepository.delete(id);
  }
}
