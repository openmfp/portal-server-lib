import { Injectable } from "@nestjs/common";
import { LocalNodesValidatorProvider, ValidationInput, ValidationResult } from ".";

@Injectable()
export class EmptyLocalNodesValidatorProvider implements LocalNodesValidatorProvider {
  validateContentConfiguration(validationInput: ValidationInput): Promise<ValidationResult> {
    return Promise.resolve({ parsedConfiguration: validationInput.contentConfiguration });
  }
}
