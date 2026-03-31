import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TmsService } from './tms.service';
import { TmsImportRow } from './entities/tms-import-row.entity';
import { TmsFormData } from './entities/tms-form-data.entity';

const mockRepo = () => ({
  count: jest.fn().mockResolvedValue(0),
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  insert: jest.fn().mockResolvedValue(undefined),
  create: jest.fn().mockReturnValue({}),
  save: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue(undefined),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  }),
});

const mockDataSource = {
  query: jest.fn().mockResolvedValue([]),
};

describe('TmsService', () => {
  let service: TmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmsService,
        {
          provide: getRepositoryToken(TmsImportRow),
          useValue: mockRepo(),
        },
        {
          provide: getRepositoryToken(TmsFormData),
          useValue: mockRepo(),
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TmsService>(TmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
