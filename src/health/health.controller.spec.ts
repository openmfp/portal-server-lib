import { DiscoveryService } from '../env';
import { EnvService } from '../env/env.service';
import { HEALTH_CHECKER_INJECTION_TOKEN } from '../injection-tokens';
import { HealthChecker } from './health-checker';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockProxy, mock } from 'jest-mock-extended';

describe('HealthController', () => {
  let controller: HealthController;
  let envService: EnvService;
  let healthChecker: MockProxy<HealthChecker>;
  let module: TestingModule;

  beforeEach(async () => {
    jest.useFakeTimers();
    healthChecker = mock<HealthChecker>();
    module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        EnvService,
        DiscoveryService,
        Logger,
        {
          provide: HEALTH_CHECKER_INJECTION_TOKEN,
          useValue: healthChecker,
        },
      ],
      imports: [HttpModule],
    }).compile();
    controller = module.get<HealthController>(HealthController);
    envService = module.get<EnvService>(EnvService);
  });

  afterEach(async () => {
    jest.useRealTimers();
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', function () {
    beforeEach(function () {
      jest.spyOn(envService, 'getEnv').mockReturnValue({
        healthCheckInterval: 0,
      });
    });

    it('should not be healthy if the checker returns false', async () => {
      healthChecker.isHealthy.mockResolvedValue(false);

      await expect(controller.getHealth()).rejects.toThrow(
        'Application health checker reported not healthy',
      );
    });

    it('should not be healthy if the checker throws exception', async () => {
      healthChecker.isHealthy.mockReturnValue(Promise.reject());

      await expect(controller.getHealth()).rejects.toThrow(
        'Application health checker reported not healthy',
      );
    });

    it('should be healthy', async () => {
      healthChecker.isHealthy.mockReturnValue(Promise.resolve(true));
      jest.advanceTimersByTime(2000);
      // also tick the promises once, so the health check can show the new result
      await Promise.resolve();

      await expect(controller.getHealth()).resolves.toBeFalsy();
    });

    it('flickering health', async () => {
      // start unhealthy
      healthChecker.isHealthy.mockReturnValue(Promise.resolve(false));

      await expect(controller.getHealth()).rejects.toThrow(
        'Application health checker reported not healthy',
      );

      // be healthy again
      healthChecker.isHealthy.mockReturnValue(Promise.resolve(true));
      jest.advanceTimersByTime(2000);
      // also tick the promises once, so the health check can show the new result
      await Promise.resolve();

      await expect(controller.getHealth()).resolves.toBeFalsy();

      // return to unhealthy
      healthChecker.isHealthy.mockReturnValue(Promise.resolve(false));
      jest.advanceTimersByTime(2000);
      // also tick the promises once, so the health check can show the new result
      await Promise.resolve();

      await expect(controller.getHealth()).rejects.toThrow(
        'Application health checker reported not healthy',
      );
    });
  });
});
