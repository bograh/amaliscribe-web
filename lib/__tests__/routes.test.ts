import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { ReleaseRepository } from '../releases'
import { inMemoryRepository } from './helpers'

/**
 * Exercises the real Next route handlers to cover the wiring between routes,
 * environment variables and the repository — the parts `api.test.ts` stubs out.
 *
 * The store is mocked so the handlers talk to an in-memory libSQL database
 * instead of reaching for TURSO_DATABASE_URL.
 */

const TOKEN = 'route-wiring-token'

let repository: ReleaseRepository
let close: () => void

vi.mock('@/lib/store', () => ({
  getReleaseRepository: () => repository,
}))

let publishRoute: typeof import('@/app/api/releases/latest/route')
let listRoute: typeof import('@/app/api/releases/route')

beforeAll(async () => {
  const memory = await inMemoryRepository()
  repository = memory.repository
  close = () => memory.client.close()

  process.env.CI_RELEASE_TOKEN = TOKEN

  publishRoute = await import('@/app/api/releases/latest/route')
  listRoute = await import('@/app/api/releases/route')
})

afterAll(() => close())

const post = (body: unknown, token: string | null = TOKEN) => {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (token !== null) headers.set('Authorization', `Bearer ${token}`)

  return publishRoute.POST(
    new Request('http://localhost/api/releases/latest', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }),
  )
}

const release = (version: string, releaseDate: string) => ({
  version,
  releaseDate,
  notes: `Notes for ${version}`,
  downloads: { linux: `https://ci.example.com/AmaliScribe-${version}.AppImage` },
})

describe('route handlers', () => {
  it('reads CI_RELEASE_TOKEN from the environment', async () => {
    const denied = await post(release('9.9.9', '2026-09-09T00:00:00Z'), 'wrong-token')
    expect(denied.status).toBe(401)

    const accepted = await post(release('1.0.0', '2026-01-01T00:00:00Z'))
    expect(accepted.status).toBe(201)
  })

  it('serves published releases newest-first from GET /api/releases', async () => {
    await post(release('1.1.0', '2026-02-01T00:00:00Z'))

    const body = await (await listRoute.GET()).json()
    expect(body.releases.map((r: { version: string }) => r.version)).toEqual(['1.1.0', '1.0.0'])
  })

  it('serves the newest release from GET /api/releases/latest', async () => {
    const body = await (await publishRoute.GET()).json()

    expect(body.release.version).toBe('1.1.0')
  })

  it('answers 500 rather than crashing when the database is unreachable', async () => {
    const broken = {
      list: () => Promise.reject(new Error('SERVER_ERROR: connection refused')),
    } as unknown as ReleaseRepository

    const previous = repository
    repository = broken
    const res = await listRoute.GET()
    repository = previous

    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('internal_error')
  })
})
