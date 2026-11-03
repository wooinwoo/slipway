import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

import type { User } from '../contracts/auth.js';
import { fail } from '../common/http.js';
import { AuthService } from './auth.service.js';

type AuthedRequest = Request & { user?: User };

/** Requires a valid bearer token; puts the user on the request for @CurrentUser(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const user = await this.auth.userFromRequest(request);
    if (!user) throw fail(401, '로그인이 필요합니다', {});
    request.user = user;
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthedRequest>().user!,
);
