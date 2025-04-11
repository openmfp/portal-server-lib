import { ContentConfiguration } from './content-configuration.js';

export enum ContentType {
  JSON = 'JSON',
  YAML = 'YAML',
}

export interface ValidationResult {
  parsedConfiguration?: string;
  validationErrors?: ValidationMessage[];
  url?: string;
}

export interface ValidationMessage {
  message: string;
}

export interface ValidationInput {
  contentType: string;
  contentConfiguration: ContentConfiguration;
}
