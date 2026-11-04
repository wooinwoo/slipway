import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module.js';
import { config } from './config.js';
import { DbModule } from './db/db.module.js';
// Resource modules are imported here and registered below.

@Controller('health')
class HealthController {
  @Get()
  health() {
    return { ok: true };
  }
}

@Module({
  imports: [
    // Per client IP per minute. Sign-in routes have a lower limit (auth.controller.ts).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: config.RATE_LIMIT }]),
    DbModule,
    AuthModule,
    // gen:modules
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
