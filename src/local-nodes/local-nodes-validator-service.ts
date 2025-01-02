import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { HttpService } from "@nestjs/axios";
import { ContentConfiguration } from "../config";

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

export interface LocalNodesValidatorService {
  validateContentConfiguration(validationInput: ValidationInput): Observable<AxiosResponse<ValidationResult, any>>;
}

@Injectable()
export class LocalNodesValidatorServiceImpl implements LocalNodesValidatorService {

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
