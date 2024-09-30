import { Test, TestingModule } from '@nestjs/testing';
import { EnvService } from '../env/env.service';
import { Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LocalNodesController } from './local-nodes.controller';

describe('LocalNodesController', () => {
  let controller: LocalNodesController;
  let module: TestingModule;

  beforeEach(async () => {
    jest.useFakeTimers();
    module = await Test.createTestingModule({
      controllers: [LocalNodesController],
      providers: [Logger],
      imports: [HttpModule],
    }).compile();
    controller = module.get<LocalNodesController>(LocalNodesController);
  });

  afterEach(async () => {
    jest.useRealTimers();
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
