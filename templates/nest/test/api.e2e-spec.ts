// Contract tests: the same requests the web app sends, against a fresh in-memory database.
// If these pass, templates/react works against this API by setting VITE_API_URL.
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';

import { AppModule } from '../src/app.module.js';
import { setup } from '../src/setup.js';
import { AuthService } from '../src/auth/auth.service.js';

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
    expect(res.body.user).toMatchObject({ name: '게스트', provider: 'guest' });
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

  it('gives each guest an isolated identity, even if the old guest email is registered', async () => {
    const registered = await api()
      .post('/api/auth/signup')
      .send({
        name: '이메일 사용자',
        email: 'guest@slipway.dev',
        password: 'long-enough-1',
      })
      .expect(200);
    const first = await api().post('/api/auth/guest').expect(200);
    const second = await api().post('/api/auth/guest').expect(200);
    expect(first.body.user.id).not.toBe(registered.body.user.id);
    expect(first.body.user.id).not.toBe(second.body.user.id);
    expect(first.body.user.provider).toBe('guest');
    const me = await api()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${first.body.token}`)
      .expect(200);
    expect(me.body.id).toBe(first.body.user.id);
  });

  it('returns a field error when concurrent signups use the same email', async () => {
    const signup = () =>
      api().post('/api/auth/signup').send({
        name: '동시 가입',
        email: 'concurrent-signup@example.com',
        password: 'long-enough-1',
      });
    const responses = await Promise.all([signup(), signup()]);
    expect(responses.map((res) => res.status).sort((a, b) => a - b)).toEqual([200, 400]);
    expect(responses.find((res) => res.status === 400)?.body.fields.email).toBe(
      '이미 가입된 이메일입니다',
    );
  });

  it('rejects social email collisions without changing an existing account', async () => {
    const email = 'identity-collision@example.com';
    const { body: original } = await api()
      .post('/api/auth/signup')
      .send({
        name: '원래 이름',
        email,
        password: 'long-enough-1',
      })
      .expect(200);
    const auth = app.get(AuthService);
    await expect(
      auth.social('kakao', {
        id: 'collision-profile',
        name: '다른 이름',
        email,
      }),
    ).rejects.toMatchObject({ status: 409 });
    const me = await api()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${original.token}`)
      .expect(200);
    expect(me.body).toMatchObject({
      id: original.user.id,
      name: '원래 이름',
      provider: 'email',
    });
  });

  it('reuses only the same social provider identity, including concurrent callbacks', async () => {
    const auth = app.get(AuthService);
    const profile = {
      id: 'repeat-profile',
      name: '소셜 사용자',
      email: 'social-repeat@example.com',
    };
    const [first, second] = await Promise.all([
      auth.social('kakao', profile),
      auth.social('kakao', profile),
    ]);
    expect(first.user.provider).toBe('kakao');
    expect(first.user.id).toBe(second.user.id);
    await expect(
      auth.social('naver', { ...profile, id: 'another-provider' }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('supports social profiles without email without mixing provider identities', async () => {
    const auth = app.get(AuthService);
    const first = await auth.social('kakao', {
      id: 'no-email',
      name: '카카오',
    });
    const again = await auth.social('kakao', {
      id: 'no-email',
      name: '카카오',
    });
    const other = await auth.social('naver', {
      id: 'no-email',
      name: '네이버',
    });
    expect(first.user.id).toBe(again.user.id);
    expect(first.user.id).not.toBe(other.user.id);
  });
});

describe('health', () => {
  it('answers without a token', async () => {
    await api().get('/api/health').expect(200, { ok: true });
  });
});
