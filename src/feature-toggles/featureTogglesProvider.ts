import { EnvService } from '../env/env.service';
import { Injectable } from '@nestjs/common';

export interface FeatureTogglesProvider {
  getFeatureToggles(): Promise<Record<string, boolean>>;
}

@Injectable()
export class EnvFeatureTogglesProvider implements FeatureTogglesProvider {
  constructor(private readonly envService: EnvService) {}

  getFeatureToggles(): Promise<Record<string, boolean>> {
    return Promise.resolve(this.envService.getFeatureToggles());
  }
}
