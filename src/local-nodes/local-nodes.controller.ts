import {
  ContentConfiguration,
  ContentConfigurationLuigiDataService,
  ContentConfigurationValidatorService,
  LuigiNode,
  ValidationResult,
} from '../config/index.js';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';
import type { Response as ExpressResponse } from 'express';

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
    private contentConfigurationLuigiDataService: ContentConfigurationLuigiDataService,
  ) {}

  @Post()
  async getLocalNodes(
    @Body() config: ConfigDto,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<TransformResult> {
    const validationResults =
      await this.contentConfigurationValidatorService.validateContentConfigurations(
        config.contentConfigurations,
      );

    if (
      validationResults.some(
        (validationResult) =>
          validationResult.validationErrors &&
          validationResult.validationErrors.length,
      )
    ) {
      return { errors: validationResults };
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
          config.language,
        ),
      };
    } catch (e: any) {
      this.logger.error(`Could not process local content configuration: ${e}`);
      throw new HttpException(
        'Could not process local content configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
