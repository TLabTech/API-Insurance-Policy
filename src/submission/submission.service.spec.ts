import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionService } from './submission.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Submission } from './submission.entity';
import { Repository } from 'typeorm';

describe('SubmissionService', () => {
  let service: SubmissionService;
  let repository: Repository<Submission>;

  const mockRepository = {
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    }),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        {
          provide: getRepositoryToken(Submission),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
    repository = module.get<Repository<Submission>>(
      getRepositoryToken(Submission),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSubmissionNumber', () => {
    it('should generate POL-{year}001 for first submission', async () => {
      const mockQueryBuilder = repository.createQueryBuilder();
      (mockQueryBuilder.getOne as jest.Mock).mockResolvedValue(null);

      // Access private method via any cast for testing
      const submissionNumber = await (
        service as any
      ).generateSubmissionNumber();

      const currentYear = new Date().getFullYear();
      expect(submissionNumber).toBe(`POL-${currentYear}001`);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'submission.submissionNumber LIKE :yearPrefix',
        { yearPrefix: `POL-${currentYear}%` },
      );
    });

    it('should increment submission number correctly', async () => {
      const currentYear = new Date().getFullYear();
      const mockSubmission = {
        submissionNumber: `POL-${currentYear}005`,
      };

      const mockQueryBuilder = repository.createQueryBuilder();
      (mockQueryBuilder.getOne as jest.Mock).mockResolvedValue(mockSubmission);

      const submissionNumber = await (
        service as any
      ).generateSubmissionNumber();

      expect(submissionNumber).toBe(`POL-${currentYear}006`);
    });

    it('should handle large numbers correctly', async () => {
      const currentYear = new Date().getFullYear();
      const mockSubmission = {
        submissionNumber: `POL-${currentYear}999`,
      };

      const mockQueryBuilder = repository.createQueryBuilder();
      (mockQueryBuilder.getOne as jest.Mock).mockResolvedValue(mockSubmission);

      const submissionNumber = await (
        service as any
      ).generateSubmissionNumber();

      expect(submissionNumber).toBe(`POL-${currentYear}1000`);
    });

    it('should format single digit numbers with leading zeros', async () => {
      const currentYear = new Date().getFullYear();
      const mockSubmission = {
        submissionNumber: `POL-${currentYear}007`,
      };

      const mockQueryBuilder = repository.createQueryBuilder();
      (mockQueryBuilder.getOne as jest.Mock).mockResolvedValue(mockSubmission);

      const submissionNumber = await (
        service as any
      ).generateSubmissionNumber();

      expect(submissionNumber).toBe(`POL-${currentYear}008`);
    });
  });
});
