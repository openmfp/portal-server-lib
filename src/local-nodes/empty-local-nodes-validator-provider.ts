import { LocalNodesValidatorProvider } from "./local-nodes-validator-provider";

export class EmptyLocalNodesValidatorProvider implements LocalNodesValidatorProvider {
  validateContentConfiguration(): Promise<any> {
    return Promise.resolve({});
  }
}
