import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { providers } from '../contracts/auth.js';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    // null for social and guest accounts, which have no password
    passwordHash: text('password_hash'),
    provider: text('provider', { enum: providers }).notNull(),
    providerId: text('provider_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('users_email_idx').on(t.email),
    uniqueIndex('users_provider_idx').on(t.provider, t.providerId),
  ],
);

export const sessions = pgTable('sessions', {
  // sha256 of the bearer token; the token itself is never stored
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

// Add domain tables here; enforce their ownership in the resource service.
