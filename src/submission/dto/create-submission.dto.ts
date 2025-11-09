import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
  IsNumberString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSubmissionDto {
  // submissionNumber is auto-generated, so it's not included in the DTO

  @ApiProperty({
    description: 'Policy holder full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  policyHolderName: string;

  @ApiProperty({
    description: 'Policy holder date of birth',
    example: '1990-01-01',
  })
  @IsDateString()
  @IsNotEmpty()
  policyHolderDOB: string;

  @ApiProperty({
    description: 'Policy holder NIK (National ID)',
    example: '1234567890123456',
  })
  @IsNumberString()
  @IsNotEmpty()
  @MinLength(16)
  @MaxLength(16)
  policyHolderNik: string;

  @ApiProperty({
    description: 'Product ID',
    example: ' p-term | p-life',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  productID: string;

  @ApiProperty({
    description: 'Sum assured amount',
    example: 100000000,
  })
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value))
  sumAssured: number;

  @ApiProperty({
    description: 'Annual premium amount',
    example: 5000000,
  })
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value))
  annualPremium: number;

  @ApiProperty({
    description: 'Payment frequency',
    example: 'MONTHLY',
    enum: ['ANNUAL', 'QUARTERLY', 'MONTHLY'],
  })
  @IsString()
  @IsIn(['ANNUAL', 'QUARTERLY', 'MONTHLY'])
  paymentFreq: string;

  @ApiProperty({
    description: 'Document file (image or PDF)',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({
    description: 'Submission status',
    example: 'UNDER_REVIEW',
    enum: [
      'UNDER_REVIEW',
      'REVISION_REQUESTED',
      'RESUBMITTED',
      'APPROVED',
      'REJECTED',
    ],
    required: true,
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'UNDER_REVIEW',
    'REVISION_REQUESTED',
    'RESUBMITTED',
    'APPROVED',
    'REJECTED',
  ])
  status?: string;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
    example: 'Customer notes or comments',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
