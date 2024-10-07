import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LocalNodesController } from './local-nodes.controller';
import {
  ContentConfigurationLuigiDataService,
  IntentResolveService,
} from '../config';
import { TextsTranslateService } from '../config/luigi/luigi-data/texts-translate.service';
import { ConfigTransferNodeService } from '../config/luigi/luigi-data/config-transfer-node.service';
import { NodeExtendedDataService } from '../config/luigi/luigi-data/node-extended-data.service';

describe('LocalNodesController', () => {
  let controller: LocalNodesController;
  let module: TestingModule;

  beforeEach(async () => {
    jest.useFakeTimers();
    module = await Test.createTestingModule({
      controllers: [LocalNodesController],
      providers: [
        Logger,
        ContentConfigurationLuigiDataService,
        TextsTranslateService,
        ConfigTransferNodeService,
        IntentResolveService,
        NodeExtendedDataService,
      ],
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
