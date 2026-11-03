import { Controller, Get, Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module.js';
import { DbModule } from './db/db.module.js';
// gen:imports (pnpm gen resource adds module imports above this line)

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
