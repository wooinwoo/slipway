import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { config } from './config.js';
import { setup } from './setup.js';

const app = setup(await NestFactory.create(AppModule));
await app.listen(config.PORT);
Logger.log(
  `http://localhost:${config.PORT}/api · ${config.DATABASE_URL?.startsWith('postgres') ? 'Postgres' : 'PGlite (./.data)'}${config.DEMO ? ' · demo' : ''}`,
  'Slipway',
);
