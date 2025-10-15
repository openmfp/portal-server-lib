import type { Request } from 'express';
import {EnvVariables} from "../env/env.service.js";

/**
 *  Redirection URL is calculated based on the incoming request
 */
export const getRedirectUri = (request: Request, env: EnvVariables)=> {
    const isStandardOrEmptyPort =
        env.frontendPort === '80' ||
        env.frontendPort === '443' ||
        !env.frontendPort;
    const port = isStandardOrEmptyPort ? '' : ':' + env.frontendPort;

    const forwardedProto = request.headers['x-forwarded-proto'];
    const forwardedProtoValue = Array.isArray(forwardedProto)
        ? forwardedProto[0]
        : forwardedProto;
    const protocol = forwardedProtoValue || request.protocol;

    const forwardedHost = request.headers['x-forwarded-host'];
    const forwardedHostValue = Array.isArray(forwardedHost)
        ? forwardedHost[0]
        : forwardedHost
    const forwardedHostname = forwardedHostValue?.split(':')[0];
    const host = forwardedHostname || request.hostname;

    const redirectionUrl = `${protocol}://${host}${port}`;
    return `${redirectionUrl}/callback?storageType=none`;
}
