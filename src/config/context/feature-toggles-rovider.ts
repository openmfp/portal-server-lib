import { EnvService } from '../../env/env.service';
import { Injectable } from '@nestjs/common';

export interface FeatureTogglesRovider {
  getFeatureToggles(): Promise<Record<string, boolean>>;
}

@Injectable()
export class EnvFeatureTogglesProvider implements FeatureTogglesRovider {
  constructor(private readonly envService: EnvService) {}

  getFeatureToggles(): Promise<Record<string, boolean>> {
    return Promise.resolve(this.envService.getFeatureToggles());
  }
}
