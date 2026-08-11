import { createClient, type Client } from '@libsql/client'

export type { Client }

/**
 * libSQL/Turso connection.
 *
 * `@libsql/client` resolves to its HTTP-only `web` build under edge conditions
 * (`edge-light`, `workerd`, `browser`) and to the native build under Node, so
 * this one import works on every target. Nothing here holds a socket or touches
 * the filesystem, which is what lets the app run serverless or on edge.
 *
 * Accepted URLs:
 *   - `libsql://<db>-<org>.turso.io` — Turso (needs `TURSO_AUTH_TOKEN`)
 *   - `http://127.0.0.1:8080`        — `turso dev`, for local development
 *   - `file:data/releases.db`        — local file, Node runtime only
 */
export function createDatabaseClient(): Client {
  const url = process.env.TURSO_DATABASE_URL

  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL is not set. Point it at your Turso database, or run `turso dev` and use http://127.0.0.1:8080.',
    )
  }

  return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
}

/**
 * Schema, as a script that is safe to re-run. Applied by `pnpm db:migrate`
 * rather than on request, since edge and serverless invocations should not each
 * pay for a migration round-trip.
 */
export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS releases (
    version      TEXT PRIMARY KEY,
    -- Zero-padded copy of version so SQLite can sort 1.10.0 above 1.9.0.
    version_sort TEXT NOT NULL,
    release_date TEXT NOT NULL,
    notes        TEXT,
    windows_url  TEXT,
    macos_url    TEXT,
    linux_url    TEXT,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS releases_order
    ON releases (release_date DESC, version_sort DESC);
`

/** Applies the schema. Idempotent, so re-running a deploy is harmless. */
export async function migrate(client: Client): Promise<void> {
  await client.executeMultiple(SCHEMA)
}
