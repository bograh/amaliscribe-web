/**
 * Applies the schema to the database in TURSO_DATABASE_URL.
 *
 * Run once per environment before the first deploy, and again after any schema
 * change: `pnpm db:migrate`. It is idempotent, so running it in a deploy hook is
 * safe. Kept out of the request path so edge and serverless invocations never
 * pay for it.
 */
import { createDatabaseClient, migrate } from '../lib/db'

const client = createDatabaseClient()

await migrate(client)

const { rows } = await client.execute('SELECT COUNT(*) AS count FROM releases')
console.log(`Schema applied to ${process.env.TURSO_DATABASE_URL}`)
console.log(`Releases currently stored: ${rows[0].count}`)
