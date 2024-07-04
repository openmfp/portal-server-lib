import { Injectable } from '@nestjs/common';
import { CrossNavigationInbounds, LuigiNode } from '../../model/luigi.node';
import { IntentResolveService } from './intent-resolve.service';

export interface NodesProcessorService {
  processNodes(payload, nodes: LuigiNode[]): void;
}

@Injectable()
export class NodesProcessorServiceImpl implements NodesProcessorService {
  constructor(private intentResolveService: IntentResolveService) {}

  public processNodes(
    payload,
    nodes: (LuigiNode & Record<string, any>)[]
  ): void {
    const luigiIntentInboundList: CrossNavigationInbounds =
      payload.crossNavigation?.inbounds;
    this.intentResolveService.resolve(nodes, luigiIntentInboundList);
  }
}
