import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TmsService } from './tms.service';
import { TmsImportRow } from './entities/tms-import-row.entity';

describe('TmsService', () => {
  let service: TmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmsService,
        {
          provide: getRepositoryToken(TmsImportRow),
          useValue: {
            count: jest.fn().mockResolvedValue(0),
            find: jest.fn().mockResolvedValue([]),
            insert: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<TmsService>(TmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
