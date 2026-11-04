import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { join, resolve } from 'node:path';

import { AppModule } from './app.module.js';
import { config } from './config.js';
import { setup } from './setup.js';

const app = setup(await NestFactory.create<NestExpressApplication>(AppModule));
if (config.WEB_DIST) {
  // One origin for web and API: static files first, then index.html for client-side routes.
  const dist = resolve(config.WEB_DIST);
  app.useStaticAssets(dist, { index: false });
  app.use((request: Request, response: Response, next: NextFunction) =>
    request.method === 'GET' && !request.path.startsWith('/api')
      ? response.sendFile(join(dist, 'index.html'))
      : next(),
  );
}
await app.listen(config.PORT);
Logger.log(
  `http://localhost:${config.PORT}/api · ${config.DATABASE_URL?.startsWith('postgres') ? 'Postgres' : 'PGlite (./.data)'}${config.DEMO ? ' · demo' : ''}${config.WEB_DIST ? ' · web' : ''}`,
  'Slipway',
);
