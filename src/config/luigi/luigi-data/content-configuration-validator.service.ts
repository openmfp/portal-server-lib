import { Injectable, Logger } from '@nestjs/common';
import { ContentConfiguration } from '../../../config/model/content-configuration';
import { HttpService } from '@nestjs/axios';
import { Observable } from "rxjs";
import { AxiosRequestConfig, AxiosResponse } from "axios";

export enum ContentType {
  JSON = 'JSON',
  YAML = 'YAML',
}

export interface ValidationResult {
  parsedConfiguration?: string;
  validationErrors?: ValidationMessage[];
}

export interface ValidationMessage {
  message: string;
}

export interface ValidationInput {
  contentType: string;
  contentConfiguration: ContentConfiguration;
}


@Injectable()
export class ContentConfigurationValidatorService {

  private logger: Logger = new Logger(ContentConfigurationValidatorService.name);

  constructor(private readonly httpService: HttpService) {
  }
  
  public validateContentConfigurationRequest(validationInput: ValidationInput): Observable<AxiosResponse<ValidationResult, any>> {
    const context: Record<string, any> = {
      ccValidatorApiUrl: process.env.CONTENT_CONFIGURATION_VALIDATOR_API_URL,
    };
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const data = {
      contentType: validationInput.contentType.toLowerCase(),
      contentConfiguration: JSON.stringify(validationInput.contentConfiguration)
    };

    return this.httpService.post<ValidationResult>(context.ccValidatorApiUrl, data, config);
  }

  public async validateContentConfiguration(contentConfigurations: ContentConfiguration[]): Promise<AxiosResponse<ValidationResult, any>[]> {
    try{
      return Promise.all(contentConfigurations.map(async contentConfiguration => {
        return await this.validateContentConfigurationRequest(
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
