import { Request, Response } from 'express';
import { Controller, Get, Logger, Post, Req, Res } from '@nestjs/common';
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
      const language: string = request.query.language as string;
      let contentConfigurations: ContentConfiguration[] = [];
      if (request.query.contentConfigurations) {
        contentConfigurations = JSON.parse(
          request.query.contentConfigurations as string
        ) as ContentConfiguration[];
      }

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
    } catch (e) {
      this.logger.error(`local nodes processing error: ${String(e)}`);
    }
  }
}
