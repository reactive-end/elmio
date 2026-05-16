import { Test, TestingModule } from '@nestjs/testing';
import { GetHealthUseCase } from '../../application/get-health.use-case';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: GetHealthUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({ status: 'ok' }),
          },
        },
      ],
    }).compile();

    healthController = module.get<HealthController>(HealthController);
  });

  it('should return ok status', async () => {
    await expect(healthController.getHealth()).resolves.toEqual({
      status: 'ok',
    });
  });
});
