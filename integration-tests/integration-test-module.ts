import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { FrameModule } from '../src';

function integrationTestModule(): TestingModuleBuilder {
  const moduleFixture: TestingModuleBuilder = Test.createTestingModule({
    imports: [FrameModule.create({})],
  });
  return moduleFixture;
}

export { integrationTestModule };
