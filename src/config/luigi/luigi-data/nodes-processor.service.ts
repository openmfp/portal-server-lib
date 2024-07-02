import { Injectable } from '@nestjs/common';
import { CrossNavigationInbounds, LuigiNode } from '../../model/luigi.node';
import { IntentResolveService } from './intent-resolve.service';

export interface NodesProcessorService {
  processNodes(payload, nodes: LuigiNode[], urlTemplateUrl: string): void;
}

@Injectable()
export class NodesProcessorServiceImpl {
  constructor(private intentResolveService: IntentResolveService) {}

  public processNodes(
    payload,
    nodes: (LuigiNode & Record<string, any>)[],
    urlTemplateUrl: string
  ): void {
    const luigiIntentInboundList: CrossNavigationInbounds =
      payload.crossNavigation?.inbounds;
    this.intentResolveService.resolve(nodes, luigiIntentInboundList);
  }
}
