import { Test, TestingModule } from '@nestjs/testing';
import { TmsController } from './tms.controller';

describe('TmsController', () => {
  let controller: TmsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TmsController],
    }).compile();

    controller = module.get<TmsController>(TmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
