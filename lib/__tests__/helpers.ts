import { createClient } from '@libsql/client'
import { migrate, type Client } from '../db'
import { ReleaseRepository } from '../releases'

/**
 * A throwaway in-memory libSQL database with the schema applied.
 *
 * The same SQL dialect and client API as Turso, without the network — which
 * keeps these tests fast and offline. Anything genuinely Turso-specific
 * (replication, auth) is out of scope for unit tests.
 */
export async function inMemoryRepository(): Promise<{
  client: Client
  repository: ReleaseRepository
}> {
  const client = createClient({ url: ':memory:' })
  await migrate(client)
  return { client, repository: new ReleaseRepository(client) }
}
