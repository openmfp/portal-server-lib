import { Injectable } from "@nestjs/common";
import { ValidationInput, ValidationResult } from ".";
import { Observable } from "rxjs";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { ContentConfigurationValidatorProvider } from "./content-configuration-validator-provider";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class LocalNodesValidatorProvider implements ContentConfigurationValidatorProvider {

  constructor(private readonly httpService: HttpService) {
  }
  
  validateContentConfiguration(validationInput: ValidationInput): Observable<AxiosResponse<ValidationResult, any>> {
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
}
