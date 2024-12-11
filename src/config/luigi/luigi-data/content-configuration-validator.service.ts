import { Inject, Injectable, Logger } from '@nestjs/common';
import { ContentConfiguration } from 'src/config/model/content-configuration';
import { LOCAL_NODES_VALIDATOR_INJECTION_TOKEN } from 'src/injection-tokens';
import { LocalNodesValidatorProvider } from 'src/local-nodes';

@Injectable()
export class ContentConfigurationValidatorService {

  constructor(
    @Inject(LOCAL_NODES_VALIDATOR_INJECTION_TOKEN)
    private localNodesValidatorProvider: LocalNodesValidatorProvider,
    private logger: Logger,
  ) {
  }

  public validateContentConfiguration(contentConfigurations: ContentConfiguration[]): void {
    
    const localNodesValidatorPromise = this.localNodesValidatorProvider
      .validateContentConfiguration()
      .catch((e: Error) => {
        this.logger.error(e);
        return e;
      });
  }

}
