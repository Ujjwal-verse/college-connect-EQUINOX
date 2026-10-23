import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const tickets = sqliteTable('tickets', { id:text('id').primaryKey(), owner:text('owner').notNull(), data:text('data').notNull(), version:integer('version').notNull().default(1), created:text('created').notNull() });
export const demoSessions = sqliteTable('demo_sessions', {tokenHash:text('token_hash').primaryKey(),owner:text('owner').notNull(),accountId:text('account_id').notNull(),expires:integer('expires').notNull()});
export const campusProfiles = sqliteTable('campus_profiles', {id:text('id').primaryKey(),owner:text('owner').notNull(),accountId:text('account_id').notNull(),data:text('data').notNull()});
export const eventResponses = sqliteTable('event_responses', {id:text('id').primaryKey(),owner:text('owner').notNull(),accountId:text('account_id').notNull(),eventId:text('event_id').notNull(),response:text('response').notNull(),updated:text('updated').notNull()});
