import { Response } from 'express';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import {
  ContentConfiguration,
  ContentConfigurationLuigiDataService,
  ContentConfigurationValidatorService,
  LuigiNode,
  ValidationResult,
} from '../config';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ConfigDto {
  @IsString()
  @IsNotEmpty()
  language: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsNotEmpty({ each: true })
  contentConfigurations: ContentConfiguration[];
}

interface TransformResult {
  nodes?: LuigiNode[];
  errors?: ValidationResult[];
}

@Controller('/rest/localnodes')
export class LocalNodesController {
  constructor(
    private logger: Logger,
    private contentConfigurationValidatorService: ContentConfigurationValidatorService,
    private contentConfigurationLuigiDataService: ContentConfigurationLuigiDataService
  ) {}

  @Post()
  async getLocalNodes(
    @Body() config: ConfigDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<TransformResult> {
    const validationResultsErrors = await this.validate(
      config.contentConfigurations
    );
    if (validationResultsErrors.length) {
      return { errors: validationResultsErrors };
    }

    try {
      return {
        nodes: await this.contentConfigurationLuigiDataService.getLuigiData(
          {
            name: 'localContentConfiguration',
            displayName: 'localContentConfiguration',
            contentConfiguration: config.contentConfigurations,
            creationTimestamp: Date.now().toString(),
          },
          config.language
        ),
      };
    } catch (e: any) {
      this.logger.error(`Could not process local content configuration: ${e}`);
      throw new HttpException(
        'Could not process local content configuration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async validate(
    contentConfigurations: ContentConfiguration[]
  ): Promise<ValidationResult[]> {
    const validationResults =
      await this.contentConfigurationValidatorService.validateContentConfigurations(
        contentConfigurations
      );

    return validationResults.filter(
      (validationResult) =>
        validationResult.validationErrors &&
        validationResult.validationErrors.length
    );
  }
}
