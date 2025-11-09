import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Email address',
    example: 'example@mail.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  lastName: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({
    description: 'Password min 6 characters',
    example: 'password123',
  })
  password: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Role ID',
    example: 1,
  })
  roleID?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Branch ID',
    example: 1,
  })
  branchID?: number;
}
