// Contract tests: the same requests the web app sends, against a fresh in-memory database.
// If these pass, templates/react works against this API by setting VITE_API_URL.
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';

import { AppModule } from '../src/app.module.js';
import { setup } from '../src/setup.js';

let app: INestApplication<App>;

const api = () => request(app.getHttpServer());

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = setup(moduleRef.createNestApplication());
  await app.init();
});

afterAll(async () => {
  await app.close();
});

describe('auth', () => {
  it('guest sign-in returns a token and user', async () => {
    const res = await api().post('/api/auth/guest').expect(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ id: 'u_guest', provider: 'guest' });
  });

  it('seeded demo account logs in; a wrong password is rejected with a message', async () => {
    await api()
      .post('/api/auth/login')
      .send({ email: 'demo@slipway.dev', password: 'demo1234' })
      .expect(200);
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'demo@slipway.dev', password: 'nope' })
      .expect(401);
    expect(res.body.message).toBe('이메일 또는 비밀번호가 맞지 않습니다');
  });

  it('signup validates fields and rejects a taken email on the email field', async () => {
    const short = await api()
      .post('/api/auth/signup')
      .send({ name: '박해커', email: 'h@example.com', password: 'short' })
      .expect(400);
    expect(short.body.fields.password).toBe('8자 이상 입력하세요');
    const taken = await api()
      .post('/api/auth/signup')
      .send({
        name: '박해커',
        email: 'demo@slipway.dev',
        password: 'long-enough-1',
      })
      .expect(400);
    expect(taken.body.fields.email).toBe('이미 가입된 이메일입니다');
    const ok = await api()
      .post('/api/auth/signup')
      .send({
        name: '박해커',
        email: 'hacker@example.com',
        password: 'long-enough-1',
      })
      .expect(200);
    expect(ok.body.user).toMatchObject({ name: '박해커', provider: 'email' });
  });

  it('me needs a token, and logout ends the session', async () => {
    await api().get('/api/auth/me').expect(401);
    const { body } = await api().post('/api/auth/guest').expect(200);
    const me = await api()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${body.token}`)
      .expect(200);
    expect(me.body.name).toBe('게스트');
    await api()
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${body.token}`)
      .expect(204);
    await api()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${body.token}`)
      .expect(401);
  });

  it('unconfigured social providers answer 404 instead of a broken redirect', async () => {
    const res = await api().get('/api/auth/kakao').expect(404);
    expect(res.body.message).toContain('kakao');
  });
});

describe('health', () => {
  it('answers without a token', async () => {
    await api().get('/api/health').expect(200, { ok: true });
  });
});
