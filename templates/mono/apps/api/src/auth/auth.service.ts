import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { and, eq, gt } from 'drizzle-orm';
import type { z } from 'zod';

import type {
  loginSchema,
  Provider,
  signupSchema,
  User,
} from '../contracts/auth.js';
import {
  hashPassword,
  newId,
  newToken,
  sha256,
  verifyPassword,
} from '../common/crypto.js';
import { fail } from '../common/http.js';
import { config } from '../config.js';
import { DB, type Db } from '../db/client.js';
import { sessions, users } from '../db/schema.js';

type Row = typeof users.$inferSelect;
const toUser = ({ id, name, email, provider }: Row): User => ({
  id,
  name,
  email,
  provider,
});

@Injectable()
export class AuthService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Creates a session and returns the shape every sign-in endpoint responds with. */
  async startSession(user: Row) {
    const token = newToken();
    const expiresAt = new Date(Date.now() + config.SESSION_DAYS * 86_400_000);
    await this.db
      .insert(sessions)
      .values({ tokenHash: sha256(token), userId: user.id, expiresAt });
    return { token, user: toUser(user) };
  }

  async login({ email, password }: z.infer<typeof loginSchema>) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw fail(401, '이메일 또는 비밀번호가 맞지 않습니다', {});
    }
    return this.startSession(user);
  }

  async signup({ name, email, password }: z.infer<typeof signupSchema>) {
    const [taken] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    if (taken)
      throw fail(400, '입력값을 확인해 주세요', {
        email: '이미 가입된 이메일입니다',
      });
    const [user] = await this.db
      .insert(users)
      .values({
        id: newId('u'),
        name,
        email,
        passwordHash: await hashPassword(password),
        provider: 'email',
      })
      .returning();
    return this.startSession(user);
  }

  async guest() {
    if (!config.ALLOW_GUEST)
      throw fail(403, '게스트 로그인이 꺼져 있습니다', {});
    const user = await this.upsert({
      id: 'u_guest',
      name: '게스트',
      email: 'guest@slipway.dev',
      provider: 'guest',
    });
    return this.startSession(user);
  }

  /** Finds or creates the account for a social profile. Kakao may withhold email. */
  async social(
    provider: Provider,
    profile: { id: string; name: string; email?: string },
  ) {
    const [existing] = await this.db
      .select()
      .from(users)
      .where(
        and(eq(users.provider, provider), eq(users.providerId, profile.id)),
      );
    if (existing) return this.startSession(existing);
    const email =
      profile.email ?? `${provider}_${profile.id}@users.noreply.slipway.dev`;
    const user = await this.upsert({
      id: newId('u'),
      name: profile.name,
      email,
      provider,
      providerId: profile.id,
    });
    return this.startSession(user);
  }

  async userFromRequest(request: Request) {
    const token = request.headers.authorization?.replace(/^Bearer /, '');
    if (!token) return null;
    const [row] = await this.db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.tokenHash, sha256(token)),
          gt(sessions.expiresAt, new Date()),
        ),
      );
    return row ? toUser(row.user) : null;
  }

  async logout(request: Request) {
    const token = request.headers.authorization?.replace(/^Bearer /, '');
    if (token)
      await this.db
        .delete(sessions)
        .where(eq(sessions.tokenHash, sha256(token)));
  }

  private async upsert(values: typeof users.$inferInsert) {
    const [user] = await this.db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({ target: users.email, set: { name: values.name } })
      .returning();
    return user;
  }
}
