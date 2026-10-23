# Database

The hosted application uses Cloudflare D1 (SQLite). The `DB` binding is configured by the host.

- `db/schema.ts` — typed schema definitions.
- `drizzle/` — ordered SQL migrations, including report, community, and committee tables.
- `drizzle.config.ts` — Drizzle migration tooling configuration.

Apply migrations to the selected D1 database before deploying a new environment. Keep real campus data out of this demo database; the shipped accounts and sample reports are fictional.
