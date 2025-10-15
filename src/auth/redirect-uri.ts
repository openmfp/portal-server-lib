import type { Request } from 'express';

/**
 *  Redirection URL is calculated based on the incoming request
 */
export const getRedirectUri = (request: Request) => {
  const forwardedPort = request.headers['x-forwarded-port'];
  const forwardedPortValue = Array.isArray(forwardedPort)
    ? forwardedPort[0]
    : forwardedPort;
  const hostPort = request.headers.host?.split(':')[1];
  const portFromRequest = forwardedPortValue || hostPort || '';

  console.log('forwardedPortValue', forwardedPortValue);
  console.log('hostPort', hostPort);

  const isStandardOrEmptyPort =
    portFromRequest === '80' || portFromRequest === '443' || !portFromRequest;
  const port = isStandardOrEmptyPort ? '' : `:${portFromRequest}`;

  const forwardedProto = request.headers['x-forwarded-proto'];
  const forwardedProtoValue = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto;
  const protocol = forwardedProtoValue || request.protocol;

  const forwardedHost = request.headers['x-forwarded-host'];
  const forwardedHostValue = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost;
  const forwardedHostname = forwardedHostValue?.split(':')[0];
  const host = forwardedHostname || request.hostname;

  const redirectionUrl = `${protocol}://${host}${port}`;
  return `${redirectionUrl}/callback?storageType=none`;
};
