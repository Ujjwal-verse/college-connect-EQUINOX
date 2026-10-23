import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const tickets = sqliteTable('tickets', { id:text('id').primaryKey(), owner:text('owner').notNull(), data:text('data').notNull(), version:integer('version').notNull().default(1), created:text('created').notNull() });
export const demoSessions = sqliteTable('demo_sessions', {tokenHash:text('token_hash').primaryKey(),owner:text('owner').notNull(),accountId:text('account_id').notNull(),expires:integer('expires').notNull()});
