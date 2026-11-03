// The error contract the web app expects: { message, fields? } with Korean messages.
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { z } from 'zod';

export function fail(
  status: number,
  message: string,
  fields?: Record<string, string>,
) {
  return new HttpException({ message, fields }, status);
}

/** Parses with the same zod schema the web form uses; 400 with per-field messages on failure. */
export function parse<T extends z.ZodType>(
  schema: T,
  value: unknown,
): z.infer<T> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const fields = Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
  throw fail(400, '입력값을 확인해 주세요', fields);
}

const defaults: Record<number, string> = {
  401: '로그인이 필요합니다',
  403: '권한이 없습니다',
  404: '찾을 수 없습니다',
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('API');

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
      response.status(500).json({
        message: '서버에서 문제가 생겼습니다. 잠시 후 다시 시도해 주세요',
      });
      return;
    }
    const status = exception.getStatus();
    const body = exception.getResponse();
    const own = typeof body === 'object' && body !== null && 'fields' in body;
    response
      .status(status)
      .json(own ? body : { message: defaults[status] ?? exception.message });
  }
}
