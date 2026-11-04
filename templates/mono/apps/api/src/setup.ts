import type { INestApplication } from '@nestjs/common';

import { ApiExceptionFilter } from './common/http.js';
import { webOrigins } from './config.js';

/** Shared by main.ts and the e2e tests so both run the exact same app. */
export function setup<T extends INestApplication>(app: T): T {
  app.setGlobalPrefix('api');
  app.enableCors({ origin: webOrigins });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();
  return app;
}
