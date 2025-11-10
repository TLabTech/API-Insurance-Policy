import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Submission } from './submission.entity';
import { Repository } from 'typeorm';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SubmissionSummaryDto } from './dto/submission-summary.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { User } from '../user/user.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createReadStream, existsSync, ReadStream } from 'fs';
import { extname, join } from 'path';

interface FileStreamResult {
  stream: ReadStream;
  mimeType: string;
  filename: string;
  size: number;
}

@Injectable()
export class SubmissionService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
  ) {}

  async createSubmission(
    createSubmissionDto: CreateSubmissionDto,
    file: Express.Multer.File,
    userId: number,
  ): Promise<Submission> {
    try {
      console.log('Service received userId:', userId); // Debug log

      // Save the file first
      const savedFile = await this.saveFile(file);

      // Generate submission number
      const submissionNumber = await this.generateSubmissionNumber();

      // Create user reference properly
      const userReference = { id: userId } as User;
      console.log('User reference:', userReference); // Debug log

      // Create submission entity
      const submission = this.submissionRepository.create({
        ...createSubmissionDto,
        submissionNumber,
        policyHolderDOB: new Date(createSubmissionDto.policyHolderDOB),
        policyHolderNik: Number.parseInt(createSubmissionDto.policyHolderNik),
        document: savedFile.filePath, // Store file path in database
        status: createSubmissionDto.status || 'pending',
        createdBy: userReference,
      });

      console.log(
        'Submission before save:',
        JSON.stringify(submission, null, 2),
      ); // Debug log

      const savedSubmission = await this.submissionRepository.save(submission);

      console.log(
        'Saved submission:',
        JSON.stringify(savedSubmission, null, 2),
      ); // Debug log

      return savedSubmission;
    } catch (error) {
      console.error('Error in createSubmission:', error); // Debug log
      throw new BadRequestException(
        `Failed to create submission: ${error.message}`,
      );
    }
  }

  async saveFile(
    file: Express.Multer.File,
  ): Promise<{ filePath: string; originalName: string; size: number }> {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await this.ensureDirectoryExists(uploadsDir);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      return {
        filePath: `uploads/${fileName}`, // Relative path for database storage
        originalName: file.originalname,
        size: file.size,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to save file: ${error.message}`);
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
    status?: string,
    productID?: string,
    search?: string,
    branchID?: number,
    createdBy?: string,
  ): Promise<PaginatedResponse<Submission>> {
    // Konversi eksplisit ke number untuk memastikan response selalu integer
    const page = Number(paginationQuery.page) || 1;
    const limit = Number(paginationQuery.limit) || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.createdBy', 'user')
      .orderBy('submission.createdAt', 'DESC');

    if (branchID) {
      queryBuilder.andWhere('user.branchID = :branchID', { branchID });
    }
    // Filter by status (exact match)
    if (status) {
      queryBuilder.andWhere('submission.status = :status', { status });
    }

    // Filter by productID (exact match)
    if (productID) {
      queryBuilder.andWhere('submission.productID = :productID', { productID });
    }

    // Filter by createdBy (exact match)
    if (createdBy) {
      queryBuilder.andWhere('submission.createdBy = :createdBy', {
        createdBy: Number(createdBy),
      });
    }

    // Search by policyHolderName, policyHolderNik, or submissionNumber (ILIKE)
    if (search) {
      queryBuilder.andWhere(
        '(submission.policyHolderName ILIKE :search OR ' +
          'CAST(submission.policyHolderNik AS TEXT) ILIKE :search OR ' +
          'submission.submissionNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [data, total_data] = await queryBuilder.getManyAndCount();

    const total_page = Math.ceil(total_data / limit);

    return {
      total_data,
      current_page: page,
      total_page,
      limit,
      data,
    };
  }

  async findOne(id: number): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
    if (!submission) {
      throw new BadRequestException('Submission not found');
    }
    return submission;
  }

  async update(
    id: number,
    updateData: Partial<CreateSubmissionDto>,
    file?: Express.Multer.File,
  ): Promise<Submission> {
    const submission = await this.findOne(id); // Verify submission exists

    const updatedSubmission: Partial<Submission> = {};

    // Handle file upload if provided
    if (file) {
      // Delete old file if exists
      if (submission.document) {
        try {
          const oldFilePath = path.join(process.cwd(), submission.document);
          await fs.unlink(oldFilePath);
        } catch (error) {
          console.warn(`Failed to delete old file:`, error.message);
        }
      }

      // Save new file
      const savedFile = await this.saveFile(file);
      updatedSubmission.document = savedFile.filePath;
    }

    // Handle each field with proper type conversion
    if (updateData.policyHolderName !== undefined)
      updatedSubmission.policyHolderName = updateData.policyHolderName;
    if (updateData.policyHolderDOB !== undefined)
      updatedSubmission.policyHolderDOB = new Date(updateData.policyHolderDOB);
    if (updateData.policyHolderNik !== undefined)
      updatedSubmission.policyHolderNik = parseInt(updateData.policyHolderNik);
    if (updateData.productID !== undefined)
      updatedSubmission.productID = updateData.productID;
    if (updateData.sumAssured !== undefined)
      updatedSubmission.sumAssured = updateData.sumAssured;
    if (updateData.annualPremium !== undefined)
      updatedSubmission.annualPremium = updateData.annualPremium;
    if (updateData.paymentFreq !== undefined)
      updatedSubmission.paymentFreq = updateData.paymentFreq;
    if (updateData.status !== undefined)
      updatedSubmission.status = updateData.status;
    if (updateData.notes !== undefined)
      updatedSubmission.notes = updateData.notes;

    await this.submissionRepository.update(id, updatedSubmission);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const submission = await this.findOne(id);

    // Optionally delete the file from disk
    if (submission.document) {
      try {
        const fullPath = path.join(process.cwd(), submission.document);
        await fs.unlink(fullPath);
      } catch (error) {
        console.warn(
          `Failed to delete file ${submission.document}:`,
          error.message,
        );
      }
    }

    await this.submissionRepository.delete(id);
  }

  // Hapus method getSummary() yang lama, hanya gunakan getSummaryOptimized
  async getSummaryOptimized(
    startDate?: Date,
    endDate?: Date,
    branchID?: number,
  ): Promise<SubmissionSummaryDto> {
    try {
      const queryBuilder = this.submissionRepository
        .createQueryBuilder('submission')
        .select('submission.status', 'status')
        .leftJoin('submission.createdBy', 'user')
        .addSelect('COUNT(*)', 'count');

      if (branchID) {
        queryBuilder.andWhere('user.branchID = :branchID', { branchID });
      }

      // Add date range filter if provided
      if (startDate && endDate) {
        queryBuilder.where(
          'submission.createdAt BETWEEN :startDate AND :endDate',
          {
            startDate,
            endDate,
          },
        );
      } else if (startDate) {
        // Only start date provided
        queryBuilder.where('submission.createdAt >= :startDate', { startDate });
      } else if (endDate) {
        // Only end date provided
        queryBuilder.where('submission.createdAt <= :endDate', { endDate });
      }

      const result = await queryBuilder
        .groupBy('submission.status')
        .getRawMany();

      const summary: SubmissionSummaryDto = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        TOTAL: 0,
      };

      // Map results to summary object
      result.forEach((item: { status: string; count: string }) => {
        const count = Number.parseInt(item.count);

        // Map UNDER_REVIEW, REVISION_REQUESTED, and RESUBMITTED to PENDING
        if (
          ['UNDER_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED'].includes(
            item.status,
          )
        ) {
          summary.PENDING += count;
        } else if (item.status === 'APPROVED' || item.status === 'REJECTED') {
          summary[item.status] += count;
        }

        summary.TOTAL += count;
      });

      return summary;
    } catch (error) {
      throw new BadRequestException(`Failed to get summary: ${error.message}`);
    }
  }

  async getFileStream(documentPath: string): Promise<FileStreamResult> {
    const fullPath = join(process.cwd(), documentPath);

    if (!existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }

    try {
      const stats = await fs.stat(fullPath);
      const stream = createReadStream(fullPath);
      const filename = documentPath.split('/').pop() || 'document';
      const ext = extname(filename).toLowerCase();

      // Determine MIME type based on file extension
      const mimeType = this.getMimeType(ext);

      return {
        stream,
        mimeType,
        filename,
        size: stats.size,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to access file: ${error.message}`);
    }
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  private async generateSubmissionNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `POL-${currentYear}`;

    // Find the highest submission number for the current year
    const lastSubmission = await this.submissionRepository
      .createQueryBuilder('submission')
      .where('submission.submissionNumber LIKE :yearPrefix', {
        yearPrefix: `${yearPrefix}%`,
      })
      .orderBy('submission.submissionNumber', 'DESC')
      .getOne();

    let increment = 1;

    if (lastSubmission?.submissionNumber) {
      // Extract the increment part from the last submission number
      const lastIncrement = lastSubmission.submissionNumber.replace(
        yearPrefix,
        '',
      );
      increment = Number.parseInt(lastIncrement, 10) + 1;
    }

    // Format increment to 3 digits with leading zeros
    const formattedIncrement = increment.toString().padStart(3, '0');

    return `${yearPrefix}${formattedIncrement}`;
  }
}
