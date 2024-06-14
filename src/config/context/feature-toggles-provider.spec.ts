import { Test, TestingModule } from '@nestjs/testing';
import { EnvService } from '../../env/env.service';
import {
  EnvFeatureTogglesProvider,
  FeatureTogglesProvider,
} from './feature-toggles-provider';

describe('EnvFeatureTogglesProvider', () => {
  let envFeatureTogglesProvider: FeatureTogglesProvider;
  let envService: EnvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvFeatureTogglesProvider,
        {
          provide: EnvService,
          useValue: {
            getFeatureToggles: jest
              .fn()
              .mockReturnValue({ feature1: true, feature2: false }),
          },
        },
      ],
    }).compile();

    envFeatureTogglesProvider = module.get<FeatureTogglesProvider>(
      EnvFeatureTogglesProvider
    );
    envService = module.get<EnvService>(EnvService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get feature toggles from EnvService', async () => {
    const featureToggles = await envFeatureTogglesProvider.getFeatureToggles();

    expect(featureToggles).toEqual({ feature1: true, feature2: false });
    expect(envService.getFeatureToggles).toHaveBeenCalled();
  });
});
