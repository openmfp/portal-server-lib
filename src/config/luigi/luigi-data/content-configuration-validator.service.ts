import { Inject, Injectable, Logger } from '@nestjs/common';
import { ContentConfiguration } from '../../../config/model/content-configuration';
import { LOCAL_NODES_VALIDATOR_INJECTION_TOKEN } from '../../../injection-tokens';
import { ContentType, LocalNodesValidatorProvider, ValidationResult } from '../../../local-nodes';

@Injectable()
export class ContentConfigurationValidatorService {

  constructor(
    @Inject(LOCAL_NODES_VALIDATOR_INJECTION_TOKEN)
    private localNodesValidatorProvider: LocalNodesValidatorProvider,
    private logger: Logger,
  ) {
  }

  public async validateContentConfiguration(contentConfigurations: ContentConfiguration[]): Promise<ValidationResult[]> {
    try{
      return Promise.all(contentConfigurations.map(async contentConfiguration => {
        return await this.localNodesValidatorProvider.validateContentConfiguration(
          {
            contentType: ContentType.JSON,
            contentConfiguration: contentConfiguration
          }
        );
      }));
    } catch (e: any) {
      this.logger.error(
        `Error while validating Content-Configuration: ${e}`
      );
      throw e;
    }
  }
}
