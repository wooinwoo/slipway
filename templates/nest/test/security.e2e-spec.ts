// Security behavior: headers, per-IP limits on sign-in, and production defaults.
// Each block imports the app fresh with its own environment, so the limits here stay low.
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';

async function boot(env: Record<string, string>) {
  vi.resetModules();
  Object.assign(process.env, env);
  const { AppModule } = await import('../src/app.module.js');
  const { setup } = await import('../src/setup.js');
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app: INestApplication<App> = setup(moduleRef.createNestApplication());
  await app.init();
  return app;
}

describe('security headers', () => {
  let app: INestApplication<App>;
  beforeAll(async () => {
    app = await boot({});
  });
  afterAll(() => app.close());

  it('sends a content security policy and hardening headers', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(res.headers['content-security-policy']).toContain(
      "default-src 'self'",
    );
    expect(res.headers['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    );
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('sign-in rate limit', () => {
  let app: INestApplication<App>;
  beforeAll(async () => {
    app = await boot({ AUTH_RATE_LIMIT: '3', RATE_LIMIT: '1000' });
  });
  afterAll(async () => {
    await app.close();
    process.env.AUTH_RATE_LIMIT = '10000';
    process.env.RATE_LIMIT = '10000';
  });

  it('answers 429 with a Korean message after the per-minute limit', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'demo@slipway.dev', password: 'wrong' });
    for (let i = 0; i < 3; i++) await attempt().expect(401);
    const res = await attempt().expect(429);
    expect(res.body.message).toBe(
      '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요',
    );
  });

  it('leaves other routes on the general limit', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200);
  });
});

describe('production defaults', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('refuses to start without the public addresses', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    delete process.env.WEB_URL;
    delete process.env.API_URL;
    await expect(import('../src/config.js')).rejects.toThrow(/WEB_URL/);
  });

  it('turns the demo account and guest sign-in off unless asked', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.WEB_URL = 'https://app.example.com';
    process.env.API_URL = 'https://app.example.com';
    delete process.env.DEMO;
    delete process.env.ALLOW_GUEST;
    const { config } = await import('../src/config.js');
    expect(config.DEMO).toBe(false);
    expect(config.ALLOW_GUEST).toBe(false);
    expect(config.TRUST_PROXY).toBe(1);
  });
});
