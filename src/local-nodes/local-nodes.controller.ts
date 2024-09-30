import { Controller, Get, Logger, Req, Res } from '@nestjs/common';
import { of } from 'rxjs';
import { LuigiNode } from 'src/config';

@Controller('/rest/localnodes')
export class LocalNodesController {
  constructor(private logger: Logger) {}

  @Get()
  async getLocalNodes(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<LuigiNode[]> {
    try {
      //TODO get luigi nodes
      const nodes: LuigiNode[] = [];

      return of(nodes).toPromise();
    } catch (e) {
      this.logger.error(`local nodes error: ${String(e)}`);
    }
  }
}
