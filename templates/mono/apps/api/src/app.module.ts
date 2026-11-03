import { Controller, Get, Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module.js';
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
    DbModule,
    AuthModule,
    // gen:modules
  ],
  controllers: [HealthController],
})
export class AppModule {}
