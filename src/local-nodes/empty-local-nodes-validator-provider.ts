import { Injectable } from "@nestjs/common";
import { LocalNodesValidatorProvider } from "./local-nodes-validator-provider";
import { ContentConfiguration } from "../config";

@Injectable()
export class EmptyLocalNodesValidatorProvider implements LocalNodesValidatorProvider {
  validateContentConfiguration(contentConfigurations: ContentConfiguration[]): Promise<any> {
    return Promise.resolve();
  }
}
