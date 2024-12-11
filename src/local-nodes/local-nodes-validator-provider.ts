import { ContentConfiguration } from "../config";

export enum ContentType {
  JSON = 'JSON',
  YAML = 'YAML',
}

export interface ValidationResult {
  parsedConfiguration?: ContentConfiguration;
  validationErrors?: ValidationMessage[];
}

export interface ValidationMessage {
  message: string;
}

export interface ValidationInput {
  contentType: string;
  contentConfiguration: ContentConfiguration;
}

export interface LocalNodesValidatorProvider {
  validateContentConfiguration(validationInput: ValidationInput): Promise<ValidationResult>;
}
