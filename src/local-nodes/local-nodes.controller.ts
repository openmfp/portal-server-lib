import { Request, Response } from 'express';
import { Controller, Get, Logger, Req, Res } from '@nestjs/common';
import { of } from 'rxjs';
import {
  ContentConfiguration,
  ContentConfigurationLuigiDataService,
  LuigiNode,
} from '../config';

@Controller('/rest/localnodes')
export class LocalNodesController {
  constructor(
    private logger: Logger,
    private luigiDataService: ContentConfigurationLuigiDataService
  ) {}

  @Get()
  async getLocalNodes(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<LuigiNode[]> {
    try {
      const language: string = request.query.language;
      const data: { value: ContentConfiguration }[] = JSON.parse(request.query.contentConfigurations);
      const contentConfigurations = data.map((cc) => cc.value);

      const nodes: LuigiNode[] = await this.luigiDataService.getLuigiData(
        {
          name: 'localContentConfiguration',
          displayName: 'localContentConfiguration',
          contentConfiguration: contentConfigurations,
          config: {},
          creationTimestamp: Date.now().toString(),
        },
        language
      );

      return of(nodes).toPromise();
    } catch (e) {
      this.logger.error(`local nodes error: ${String(e)}`);
    }
  }
}
