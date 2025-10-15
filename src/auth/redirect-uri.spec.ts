import { getRedirectUri } from './redirect-uri.js';
import type { Request } from 'express';
import { EnvVariables } from '../env/env.service.js';

describe('getRedirectUri', () => {
    const baseEnv: EnvVariables = {
        frontendPort: '3000',
    } as any;

    const makeReq = (headers: Record<string, any> = {}, hostname = 'example.com', protocol = 'http'): Request =>
        ({
            headers,
            hostname,
            protocol,
        } as Request);

    it('uses x-forwarded-proto and x-forwarded-host when present', () => {
        const req = makeReq({
            'x-forwarded-proto': 'https',
            'x-forwarded-host': 'forwarded.com',
        });
        const result = getRedirectUri(req, baseEnv);
        expect(result).toBe('https://forwarded.com:3000/callback?storageType=none');
    });

    it('uses first value when x-forwarded-proto and host are arrays', () => {
        const req = makeReq({
            'x-forwarded-proto': ['https', 'http'],
            'x-forwarded-host': ['multi.com:8080', 'other.com'],
        });
        const result = getRedirectUri(req, baseEnv);
        expect(result).toBe('https://multi.com:3000/callback?storageType=none');
    });

    it('falls back to request protocol and hostname if headers missing', () => {
        const req = makeReq({}, 'local.dev', 'http');
        const result = getRedirectUri(req, baseEnv);
        expect(result).toBe('http://local.dev:3000/callback?storageType=none');
    });

    it('omits port if standard (80 or 443)', () => {
        const env80 = { frontendPort: '80' } as EnvVariables;
        const env443 = { frontendPort: '443' } as EnvVariables;
        const req = makeReq({ 'x-forwarded-proto': 'https', 'x-forwarded-host': 'secure.com' });
        expect(getRedirectUri(req, env80)).toBe('https://secure.com/callback?storageType=none');
        expect(getRedirectUri(req, env443)).toBe('https://secure.com/callback?storageType=none');
    });

    it('omits port if env.frontendPort is empty', () => {
        const envEmpty = { frontendPort: '' } as EnvVariables;
        const req = makeReq({ 'x-forwarded-proto': 'https', 'x-forwarded-host': 'noport.com' });
        const result = getRedirectUri(req, envEmpty);
        expect(result).toBe('https://noport.com/callback?storageType=none');
    });

    it('extracts hostname correctly when x-forwarded-host includes port', () => {
        const req = makeReq({ 'x-forwarded-proto': 'https', 'x-forwarded-host': 'withport.com:8080' });
        const result = getRedirectUri(req, baseEnv);
        expect(result).toBe('https://withport.com:3000/callback?storageType=none');
    });
});
