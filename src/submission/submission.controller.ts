import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SubmissionSummaryDto } from './dto/submission-summary.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import type { Submission } from './submission.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiProperty,
} from '@nestjs/swagger';
import express from 'express';
import { AuthGuard } from '../auth/auth.guard';

class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  document: any;
}

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('submission')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('document', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Submission with document upload',
    type: FileUploadDto,
  })
  @ApiBody({ type: CreateSubmissionDto })
  async createSubmission(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          // Perbaiki regex untuk MIME type, bukan extension
          new FileTypeValidator({
            fileType:
              /^(image\/jpeg|image\/jpg|image\/png|image\/webp|application\/pdf)$/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    document: Express.Multer.File,
    @Req() req: any,
  ) {
    try {
      console.log('Request user:', req.user); // Debug log

      const userId = req.user?.sub;
      console.log('Extracted userId:', userId); // Debug log

      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      return await this.submissionService.createSubmission(
        createSubmissionDto,
        document,
        userId,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to create submission: ${error.message}`,
      );
    }
  }

  @Get('summary')
  async getSummary(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<SubmissionSummaryDto> {
    const branchID = req.user?.branchID;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Validate dates if provided
    if (start && Number.isNaN(start.getTime())) {
      throw new BadRequestException(
        'Invalid startDate format. Use ISO 8601 format (e.g., 2024-01-01)',
      );
    }
    if (end && Number.isNaN(end.getTime())) {
      throw new BadRequestException(
        'Invalid endDate format. Use ISO 8601 format (e.g., 2024-12-31)',
      );
    }

    return await this.submissionService.getSummaryOptimized(
      start,
      end,
      branchID,
    );
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('productID') productID?: string,
    @Query('search') search?: string,
    @Query('createdBy') createdBy?: string,
  ): Promise<PaginatedResponse<Submission>> {
    const branchID = req.user?.branchID;
    return await this.submissionService.findAll(
      paginationQuery,
      status,
      productID,
      search,
      branchID,
      createdBy,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.submissionService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('document', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update submission with optional document upload',
    type: FileUploadDto,
  })
  @ApiBody({ type: CreateSubmissionDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubmissionDto: Partial<CreateSubmissionDto>,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType:
              /^(image\/jpeg|image\/jpg|image\/png|image\/webp|application\/pdf)$/,
          }),
        ],
        fileIsRequired: false, // File optional untuk update
      }),
    )
    document?: Express.Multer.File,
  ) {
    try {
      return await this.submissionService.update(
        id,
        updateSubmissionDto,
        document,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to update submission: ${error.message}`,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.submissionService.remove(id);
    return true;
  }

  @Get(':id/stream')
  async streamSubmissionFile(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<StreamableFile> {
    try {
      const submission = await this.submissionService.findOne(id);

      if (!submission.document) {
        throw new BadRequestException('No document found for this submission');
      }
      const { stream, mimeType, filename } =
        await this.submissionService.getFileStream(submission.document);
      // Set appropriate headers for streaming
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      });
      return new StreamableFile(stream);
    } catch (error) {
      throw new BadRequestException(`Failed to stream file: ${error.message}`);
    }
  }
}
