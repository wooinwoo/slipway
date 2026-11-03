import {
  Global,
  Inject,
  Module,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';

import { hashPassword } from '../common/crypto.js';
import { config } from '../config.js';
import { connect, DB, type Db } from './client.js';
import { users } from './schema.js';

const CONNECTION = Symbol('CONNECTION');
type Connection = Awaited<ReturnType<typeof connect>>;

@Global()
@Module({
  providers: [
    { provide: CONNECTION, useFactory: () => connect(config.DATABASE_URL) },
    {
      provide: DB,
      useFactory: (connection: Connection) => connection.db,
      inject: [CONNECTION],
    },
  ],
  exports: [DB],
})
export class DbModule implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(@Inject(CONNECTION) private readonly connection: Connection) {}

  /** In demo mode the database always has the demo account (demo@slipway.dev / demo1234). */
  async onApplicationBootstrap() {
    if (config.DEMO) await seed(this.connection.db);
  }

  async onApplicationShutdown() {
    await this.connection.close();
  }
}

export async function seed(db: Db) {
  await db
    .insert(users)
    .values({
      id: 'u_demo',
      name: '김슬립',
      email: 'demo@slipway.dev',
      passwordHash: await hashPassword('demo1234'),
      provider: 'email',
    })
    .onConflictDoNothing();
}
