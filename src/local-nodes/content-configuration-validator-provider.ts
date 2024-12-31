import { Observable } from "rxjs";
import { ContentConfiguration } from "../config";
import { AxiosResponse } from "axios";

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

export interface ContentConfigurationValidatorProvider {
  validateContentConfiguration(validationInput: ValidationInput): Observable<AxiosResponse<ValidationResult, any>>;
}
