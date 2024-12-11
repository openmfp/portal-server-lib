import { ContentConfiguration } from "../config";

export interface LocalNodesValidatorProvider {
  validateContentConfiguration(contentConfigurations: ContentConfiguration[]): Promise<any>;
}
