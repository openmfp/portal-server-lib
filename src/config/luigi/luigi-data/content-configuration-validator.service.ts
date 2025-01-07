import { Injectable, Logger } from '@nestjs/common';
import { ContentConfiguration } from '../../../config/model/content-configuration';
import { ContentType, LocalNodesValidatorService, ValidationResult } from '../../../local-nodes';
import { AxiosResponse } from 'axios';

@Injectable()
export class ContentConfigurationValidatorService {

  private logger: Logger = new Logger(ContentConfigurationValidatorService.name);

  constructor(
    private localNodesValidatorService: LocalNodesValidatorService,
  ) {
  }

  public async validateContentConfiguration(contentConfigurations: ContentConfiguration[]): Promise<AxiosResponse<ValidationResult, any>[]> {
    try{
      return Promise.all(contentConfigurations.map(async contentConfiguration => {
        return await this.localNodesValidatorService.validateContentConfiguration(
          {
            contentType: ContentType.JSON,
            contentConfiguration: contentConfiguration
          }
        ).toPromise();
      }));
    } catch (e: any) {
      this.logger.error(
        `Error while validating Content-Configuration: ${e}`
      );
      throw e;
    }
  }
}
