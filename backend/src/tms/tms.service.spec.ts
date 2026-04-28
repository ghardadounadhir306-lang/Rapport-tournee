import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TmsService } from './tms.service';
import { TmsImportRow } from './entities/tms-import-row.entity';
import { TmsFormData } from './entities/tms-form-data.entity';
import { ActivityLogService } from '../activity/activity-log.service';
import { AnomalyEvaluationService } from '../anomalies/anomaly-evaluation.service';
import { ClientsPoiService } from '../clients-poi/clients-poi.service';
import { TourLegKmHistoryService } from './tour-leg-km-history.service';

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
        {
          provide: ActivityLogService,
          useValue: { log: jest.fn().mockResolvedValue(undefined), findRecent: jest.fn() },
        },
        {
          provide: AnomalyEvaluationService,
          useValue: { evaluateAfterSave: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: ClientsPoiService,
          useValue: { theoreticalKmLegsAlongTour: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: TourLegKmHistoryService,
          useValue: { getAverage: jest.fn().mockResolvedValue(null), recordSamples: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<TmsService>(TmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
