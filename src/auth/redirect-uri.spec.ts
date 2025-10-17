import { getRedirectUri } from './redirect-uri.js';
import type { Request } from 'express';

describe('getRedirectUri', () => {
  const makeReq = (options: Partial<Request>): Request =>
    ({
      headers: options.headers || {},
      hostname: options.hostname || 'example.com',
      protocol: options.protocol || 'http',
    }) as Request;

  it('uses x-forwarded headers for proto, host, and port', () => {
    const req = makeReq({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'forwarded.com',
        'x-forwarded-port': '8443',
      },
    });
    const result = getRedirectUri(req);
    expect(result).toBe('https://forwarded.com:8443/callback?storageType=none');
  });

  it('handles x-forwarded headers as arrays', () => {
    const req = makeReq({
      headers: {
        'x-forwarded-proto': ['https', 'http'],
        'x-forwarded-host': ['multi.com:8080', 'other.com'],
        'x-forwarded-port': ['8081', '8082'],
      },
    });
    const result = getRedirectUri(req);
    expect(result).toBe('https://multi.com:8081/callback?storageType=none');
  });

  it('omits standard ports 80 and 443', () => {
    const req80 = makeReq({
      headers: {
        'x-forwarded-proto': 'http',
        'x-forwarded-host': 'plain.com',
        'x-forwarded-port': '80',
      },
    });
    const req443 = makeReq({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'secure.com',
        'x-forwarded-port': '443',
      },
    });
    expect(getRedirectUri(req80)).toBe(
      'http://plain.com/callback?storageType=none',
    );
    expect(getRedirectUri(req443)).toBe(
      'https://secure.com/callback?storageType=none',
    );
  });

  it('falls back to host header port when x-forwarded-port missing', () => {
    const req = makeReq({
      headers: {
        host: 'local.dev:3000',
        'x-forwarded-proto': 'http',
      },
    });
    const result = getRedirectUri(req);
    expect(result).toBe('http://example.com:3000/callback?storageType=none');
  });

  it('falls back to request protocol and hostname if no headers', () => {
    const req = makeReq({ hostname: 'app.local', protocol: 'http' });
    const result = getRedirectUri(req);
    expect(result).toBe('http://app.local/callback?storageType=none');
  });

  it('extracts hostname correctly from x-forwarded-host with port', () => {
    const req = makeReq({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'withport.com:9090',
      },
    });
    const result = getRedirectUri(req);
    expect(result).toBe('https://withport.com/callback?storageType=none');
  });
});
