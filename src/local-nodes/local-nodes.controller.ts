import { Request, Response } from 'express';
import {
  Body,
  Controller,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ContentConfiguration,
  ContentConfigurationLuigiDataService,
  LuigiNode,
} from '../config';
import { IsArray, IsNotEmpty } from 'class-validator';

export class ConfigDto {
  @IsNotEmpty()
  language: string;

  @IsArray()
  @IsNotEmpty({ each: true })
  contentConfigurations: ContentConfiguration[];
}

@Controller('/rest/localnodes')
export class LocalNodesController {
  constructor(
    private logger: Logger,
    private contentConfigurationLuigiDataService: ContentConfigurationLuigiDataService
  ) {}

  @Post()
  async getLocalNodes(
    @Body() config: ConfigDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<LuigiNode[]> {
    try {
      const language: string = config.language as string;
      const contentConfigurations: ContentConfiguration[] =
        config.contentConfigurations || [];

      const nodes: LuigiNode[] =
        await this.contentConfigurationLuigiDataService.getLuigiData(
          {
            name: 'localContentConfiguration',
            displayName: 'localContentConfiguration',
            contentConfiguration: contentConfigurations,
            config: {},
            creationTimestamp: Date.now().toString(),
          },
          language
        );

      return nodes;
    } catch (e: any) {
      this.logger.error(`Could not process local content configuration: ${e}`);
      response.status(HttpStatus.BAD_REQUEST);
      return undefined;
    }
  }
}
