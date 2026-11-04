import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import { join, resolve } from 'node:path';

import { AppModule } from './app.module.js';
import { config } from './config.js';
import { setup } from './setup.js';

const app = setup(await NestFactory.create<NestExpressApplication>(AppModule));
app.set('trust proxy', config.TRUST_PROXY);
// gzip for API responses and the web build; most hosts don't compress for you.
app.use(compression());
if (config.WEB_DIST) {
  // One origin for web and API: static files first, then index.html for client-side routes.
  const dist = resolve(config.WEB_DIST);
  // Built files carry a content hash in their names, so browsers may keep them for a year.
  app.useStaticAssets(dist, {
    index: false,
    setHeaders: (response, path) =>
      response.setHeader(
        'Cache-Control',
        path.includes('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
      ),
  });
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (request.method !== 'GET' || request.path.startsWith('/api'))
      return next();
    response.setHeader('Cache-Control', 'no-cache');
    response.sendFile(join(dist, 'index.html'));
  });
}
await app.listen(config.PORT);
Logger.log(
  `http://localhost:${config.PORT}/api · ${config.DATABASE_URL?.startsWith('postgres') ? 'Postgres' : 'PGlite (./.data)'}${config.DEMO ? ' · demo' : ''}${config.WEB_DIST ? ' · web' : ''}`,
  'Slipway',
);
