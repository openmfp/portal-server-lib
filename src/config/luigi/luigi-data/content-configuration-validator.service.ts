import { Inject, Injectable, Logger } from '@nestjs/common';
import { ContentConfiguration } from '../../../config/model/content-configuration';
import { LOCAL_NODES_VALIDATOR_INJECTION_TOKEN } from '../../../injection-tokens';
import { LocalNodesValidatorProvider } from '../../../local-nodes';

@Injectable()
export class ContentConfigurationValidatorService {

  constructor(
    @Inject(LOCAL_NODES_VALIDATOR_INJECTION_TOKEN)
    private localNodesValidatorProvider: LocalNodesValidatorProvider,
    private logger: Logger,
  ) {
  }

  public validateContentConfiguration(contentConfigurations: ContentConfiguration[]): void {
    this.localNodesValidatorProvider.validateContentConfiguration(contentConfigurations);
  }

}
