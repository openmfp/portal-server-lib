import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { PortalModule } from '../src';

function integrationTestModule(): TestingModuleBuilder {
  const moduleFixture: TestingModuleBuilder = Test.createTestingModule({
    imports: [PortalModule.create({})],
  });
  return moduleFixture;
}

export { integrationTestModule };
