import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';

import { loginSchema, signupSchema, type User } from '../contracts/auth.js';
import { fail, parse } from '../common/http.js';
import { webOrigins } from '../config.js';
import { AuthGuard, CurrentUser } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import {
  authorizeUrl,
  fetchProfile,
  isConfigured,
  socialProviders,
  type SocialProvider,
} from './oauth.js';

const STATE_COOKIE = 'slipway_oauth_state';

function socialProvider(value: string): SocialProvider {
  const provider = socialProviders.find((p) => p === value);
  if (!provider || !isConfigured(provider))
    throw fail(404, `${value} 로그인이 설정되지 않았습니다`, {});
  return provider;
}

function readCookie(request: Request, name: string) {
  return request.headers.cookie
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([key]) => key === name)?.[1];
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: unknown) {
    return this.auth.login(parse(loginSchema, body));
  }

  @Post('signup')
  @HttpCode(200)
  signup(@Body() body: unknown) {
    return this.auth.signup(parse(signupSchema, body));
  }

  @Post('guest')
  @HttpCode(200)
  guest() {
    return this.auth.guest();
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: User) {
    return user;
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: Request) {
    await this.auth.logout(request);
  }

  /** Step 1: send the browser to the provider. A random state in a short-lived cookie guards the callback. */
  @Get(':provider')
  redirect(@Param('provider') value: string, @Res() response: Response) {
    const provider = socialProvider(value);
    const state = randomBytes(16).toString('base64url');
    response.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 600_000,
      path: '/api/auth',
    });
    response.redirect(authorizeUrl(provider, state));
  }

  /** Step 2: trade the code for a profile, sign in, and hand the token to the web app in the URL fragment. */
  @Get(':provider/callback')
  async callback(
    @Param('provider') value: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const provider = socialProvider(value);
    if (!code || !state || state !== readCookie(request, STATE_COOKIE)) {
      throw fail(
        400,
        '로그인 요청이 만료되었거나 올바르지 않습니다. 다시 시도해 주세요',
        {},
      );
    }
    response.clearCookie(STATE_COOKIE, { path: '/api/auth' });
    const session = await this.auth.social(
      provider,
      await fetchProfile(provider, code, state),
    );
    // The fragment never reaches servers or access logs.
    response.redirect(`${webOrigins[0]}/auth/callback#token=${session.token}`);
  }
}
