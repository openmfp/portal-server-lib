import { Injectable } from "@nestjs/common";
import { LocalNodesValidatorProvider, ValidationInput, ValidationResult } from ".";
import { Observable, of } from "rxjs";
import { AxiosResponse } from "axios";

@Injectable()
export class EmptyLocalNodesValidatorProvider implements LocalNodesValidatorProvider {
  validateContentConfiguration(validationInput: ValidationInput): Observable<AxiosResponse<ValidationResult, any>> {
    return of({
      data: { parsedConfiguration: validationInput.contentConfiguration },
      status: 200,
    } as AxiosResponse<ValidationResult, any>);
  }
}
