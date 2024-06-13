import { Test, TestingModuleBuilder } from '@nestjs/testing';
import {
  ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
  PortalModule,
  PortalModuleOptions,
} from '../src';

function integrationTestModule(
  options: PortalModuleOptions
): TestingModuleBuilder {
  const moduleFixture: TestingModuleBuilder = Test.createTestingModule({
    imports: [PortalModule.create({})],
  });

  if (options.envVariablesProvider) {
    moduleFixture
      .overrideProvider(ENV_VARIABLES_PROVIDER_INJECTION_TOKEN)
      .useValue(options.envVariablesProvider);
  }
  return moduleFixture;
}

export { integrationTestModule };
