import { Injectable } from '@nestjs/common';
import { ContentConfiguration } from 'src/config/model/content-configuration';

@Injectable()
export class ContentConfigurationValidatorService {

  public validateContentConfiguration(contentConfigurations: ContentConfiguration[]): void {
    //TODO throw errors if not valid
    console.log("validate content configuration");
  }

}
