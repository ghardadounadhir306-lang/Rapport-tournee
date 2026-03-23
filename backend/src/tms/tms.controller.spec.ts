import { Test, TestingModule } from '@nestjs/testing';
import { TmsController } from './tms.controller';
import { TmsService } from './tms.service';

describe('TmsController', () => {
  let controller: TmsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TmsController],
      providers: [
        {
          provide: TmsService,
          useValue: {
            getData: jest.fn().mockResolvedValue({ entriesCount: 0, list: [], active: null }),
            importExcel: jest.fn().mockResolvedValue({ sheetName: 'Sheet1', rowsDetected: 0, inserted: 0 }),
          },
        },
      ],
    }).compile();

    controller = module.get<TmsController>(TmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
