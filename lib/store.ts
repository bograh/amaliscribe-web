import { createDatabaseClient } from './db'
import { ReleaseRepository } from './releases'

let repository: ReleaseRepository | null = null

/**
 * Repository handle for the current runtime instance.
 *
 * The libSQL client is stateless HTTP, so memoising it is just an allocation
 * saving — there is no connection to keep warm and nothing to close. That is
 * what makes this safe in serverless and edge invocations.
 */
export function getReleaseRepository(): ReleaseRepository {
  repository ??= new ReleaseRepository(createDatabaseClient())
  return repository
}
