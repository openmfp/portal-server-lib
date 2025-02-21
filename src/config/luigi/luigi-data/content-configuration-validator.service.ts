import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map, Observable } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ValidationInput,
  ValidationResult,
  ContentType,
  ContentConfiguration,
} from '../../../config';

@Injectable()
export class ContentConfigurationValidatorService {
  private logger: Logger = new Logger(
    ContentConfigurationValidatorService.name
  );

  constructor(private readonly httpService: HttpService) {}

  public validateContentConfigurationRequest(
    validationInput: ValidationInput
  ): Observable<AxiosResponse<ValidationResult, any>> {
    const ccValidatorApiUrl =
      process.env.CONTENT_CONFIGURATION_VALIDATOR_API_URL;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const data = {
      contentType: validationInput.contentType.toLowerCase(),
      contentConfiguration: JSON.stringify(
        validationInput.contentConfiguration
      ),
    };

    return this.httpService.post<ValidationResult>(
      ccValidatorApiUrl,
      data,
      config
    );
  }

  public validateContentConfigurations(
    contentConfigurations: ContentConfiguration[]
  ): Promise<ValidationResult[]> {
    try {
      return Promise.all(
        contentConfigurations.map((contentConfiguration) => {
          return lastValueFrom(
            this.validateContentConfigurationRequest({
              contentType: ContentType.JSON,
              contentConfiguration,
            }).pipe(
              map((response): ValidationResult => {
                return {
                  url: contentConfiguration.url,
                  ...response.data,
                };
              })
            )
          );
        })
      );
    } catch (e: any) {
      this.logger.error(`Error while validating Content-Configuration: ${e}`);
      throw e;
    }
  }
}
