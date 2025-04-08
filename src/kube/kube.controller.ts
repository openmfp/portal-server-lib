import { KubeConfig } from '@kubernetes/client-node';
import { Controller, Get, Req, Res} from '@nestjs/common';
import { readFileSync } from 'fs';
import { Request, Response } from 'express';

@Controller('/rest/kube')
export class KubeController {

  @Get('ca-cert')
  async getCaCert(@Req() request: Request,
    @Res({ passthrough: true }) response: Response): Promise<string> {

    const kc = new KubeConfig();
    const kubeconfigPath = request.query.kubeconfigPath.toString();

    if (kubeconfigPath) {
      kc.loadFromFile(kubeconfigPath);
    } else {
      kc.loadFromDefault();
    }

    const cluster = kc.getCurrentCluster();

    if (!cluster) {
      console.warn('No current cluster found in kubeconfig.');
      return null;
    }

    if (cluster.caData) {
      return Buffer.from(cluster.caData, 'base64').toString('utf-8');
    }

    if (cluster.caFile) {
      return readFileSync(cluster.caFile, 'utf-8');
    }

    console.warn('No CA data or CA file path found in the kubeconfig.');
    return null;
  }
}
