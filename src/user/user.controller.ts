import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidateUserDto } from './dto/validate-user.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import type { User } from './user.entity';

@Controller('users')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('search') search?: string,
    @Query('roleID') roleID?: string,
  ): Promise<PaginatedResponse<User>> {
    return this.userService.findAll(paginationQuery, roleID, search);
  }

  // Place specific routes BEFORE parameterized routes to avoid conflicts
  @Post('auth/validate')
  @HttpCode(HttpStatus.OK)
  async validatePassword(
    @Body() validateData: ValidateUserDto,
  ): Promise<{ valid: boolean; user?: User }> {
    const user = await this.userService.validateUserPassword(
      validateData.email,
      validateData.password,
    );
    return {
      valid: !!user,
      user: user || undefined,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User | null> {
    return this.userService.findOne(id);
  }

  @Post()
  async create(@Body() userData: CreateUserDto): Promise<User> {
    return this.userService.create(userData);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData: UpdateUserDto,
  ): Promise<User | null> {
    return this.userService.update(id, userData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userService.remove(id);
  }
}
