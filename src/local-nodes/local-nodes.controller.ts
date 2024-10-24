import { Request, Response } from 'express';
import { Controller, Get, HttpStatus, Logger, Post, Req, Res } from '@nestjs/common';
import {
  ContentConfiguration,
  ContentConfigurationLuigiDataService,
  LuigiNode,
} from '../config';

@Controller('/rest/localnodes')
export class LocalNodesController {
  constructor(
    private logger: Logger,
    private contentConfigurationLuigiDataService: ContentConfigurationLuigiDataService
  ) {}

  @Post()
  async getLocalNodes(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<LuigiNode[]> {
    try {
      if (
        !request.body ||
        !request.body.language ||
        !request.body.contentConfigurations
      ) {
        throw 'Could not reach data required for local nodes processing';
      }

      const language: string = request.body.language as string;
      const contentConfigurations: ContentConfiguration[] =
        request.body.contentConfigurations || [];

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
