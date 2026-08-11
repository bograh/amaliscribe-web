import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { latestRelease, listReleases, publishRelease } from '../api'
import type { Client } from '../db'
import type { ReleaseRepository } from '../releases'
import { inMemoryRepository } from './helpers'

const TOKEN = 'test-ci-token'

let client: Client
let repository: ReleaseRepository

const validPayload = {
  version: '1.2.3',
  releaseDate: '2026-08-11T12:00:00Z',
  notes: 'Bug fixes and performance improvements.',
  downloads: {
    windows: 'https://example.com/AmaliScribe-1.2.3-setup.exe',
    macos: 'https://example.com/AmaliScribe-1.2.3.dmg',
    linux: 'https://example.com/AmaliScribe-1.2.3.AppImage',
  },
}

/** Mirrors what CI sends: a POST with a bearer token and a JSON body. */
function publishRequest(
  body: unknown,
  { token = TOKEN as string | null, raw }: { token?: string | null; raw?: string } = {},
) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (token !== null) headers.set('Authorization', `Bearer ${token}`)

  return new Request('http://localhost/api/releases/latest', {
    method: 'POST',
    headers,
    body: raw ?? JSON.stringify(body),
  })
}

const publish = (body: unknown, options?: { token?: string | null; raw?: string }) =>
  publishRelease(publishRequest(body, options), { repository, ciReleaseToken: TOKEN })

const listed = async () => (await (await listReleases(repository)).json()).releases

beforeEach(async () => {
  ;({ client, repository } = await inMemoryRepository())
})

afterEach(() => {
  client.close()
})

describe('authorization', () => {
  it('rejects a request with no Authorization header', async () => {
    const res = await publish(validPayload, { token: null })

    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('unauthorized')
  })

  it('advertises the expected scheme on a 401', async () => {
    const res = await publish(validPayload, { token: null })

    expect(res.headers.get('WWW-Authenticate')).toContain('Bearer')
  })

  it('rejects a wrong bearer token', async () => {
    const res = await publish(validPayload, { token: 'not-the-token' })

    expect(res.status).toBe(401)
  })

  it('rejects a token that is a prefix of the real token', async () => {
    const res = await publish(validPayload, { token: TOKEN.slice(0, -1) })

    expect(res.status).toBe(401)
  })

  it('rejects a malformed Authorization scheme', async () => {
    const request = new Request('http://localhost/api/releases/latest', {
      method: 'POST',
      headers: { Authorization: `Token ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    })

    const res = await publishRelease(request, { repository, ciReleaseToken: TOKEN })
    expect(res.status).toBe(401)
  })

  it('does not persist anything when unauthorized', async () => {
    await publish(validPayload, { token: 'nope' })

    expect(await listed()).toEqual([])
  })

  it('accepts a valid bearer token', async () => {
    const res = await publish(validPayload)

    expect(res.status).toBe(201)
  })

  it('returns 500 when the server has no CI token configured', async () => {
    const res = await publishRelease(publishRequest(validPayload), {
      repository,
      ciReleaseToken: '',
    })

    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('server_misconfigured')
  })
})

describe('validation', () => {
  const fieldsOf = async (res: Response) =>
    ((await res.json()).details ?? []).map((d: { field: string }) => d.field)

  it('rejects a non-object body', async () => {
    const res = await publish('nope')

    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('validation_failed')
  })

  it('rejects malformed JSON with 400 rather than 500', async () => {
    const res = await publish(null, { raw: '{"version": ' })

    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('invalid_json')
  })

  it('requires version, releaseDate and downloads', async () => {
    const res = await publish({})

    expect(res.status).toBe(400)
    expect(await fieldsOf(res)).toEqual(
      expect.arrayContaining(['version', 'releaseDate', 'downloads']),
    )
  })

  it('rejects a non-semver version', async () => {
    const res = await publish({ ...validPayload, version: 'v1.2' })

    expect(res.status).toBe(400)
    expect(await fieldsOf(res)).toContain('version')
  })

  it('accepts a semver pre-release version', async () => {
    const res = await publish({ ...validPayload, version: '2.0.0-beta.1' })

    expect(res.status).toBe(201)
    expect((await res.json()).release.version).toBe('2.0.0-beta.1')
  })

  it('rejects an unparseable releaseDate', async () => {
    const res = await publish({ ...validPayload, releaseDate: 'last tuesday' })

    expect(res.status).toBe(400)
    expect(await fieldsOf(res)).toContain('releaseDate')
  })

  it('normalises releaseDate to an ISO UTC timestamp', async () => {
    const res = await publish({ ...validPayload, releaseDate: '2026-08-11T12:00:00Z' })

    expect((await res.json()).release.releaseDate).toBe('2026-08-11T12:00:00.000Z')
  })

  it('treats notes as optional', async () => {
    const withoutNotes: Record<string, unknown> = { ...validPayload }
    delete withoutNotes.notes

    const res = await publish(withoutNotes)

    expect(res.status).toBe(201)
    expect((await res.json()).release.notes).toBeNull()
  })

  it('rejects non-string notes', async () => {
    const res = await publish({ ...validPayload, notes: { text: 'hi' } })

    expect(res.status).toBe(400)
    expect(await fieldsOf(res)).toContain('notes')
  })

  it('requires at least one download URL', async () => {
    const res = await publish({ ...validPayload, downloads: {} })

    expect(res.status).toBe(400)
    expect(await fieldsOf(res)).toContain('downloads')
  })

  it('rejects unknown platform keys', async () => {
    const res = await publish({
      ...validPayload,
      downloads: { ...validPayload.downloads, freebsd: 'https://example.com/a.txz' },
    })

    expect(res.status).toBe(400)
    expect(await fieldsOf(res)).toContain('downloads.freebsd')
  })

  it('rejects a non-http download URL', async () => {
    const res = await publish({
      ...validPayload,
      downloads: { ...validPayload.downloads, linux: 'ftp://example.com/a.AppImage' },
    })

    expect(res.status).toBe(400)
    expect(await fieldsOf(res)).toContain('downloads.linux')
  })

  it('rejects a relative download URL', async () => {
    const res = await publish({ ...validPayload, downloads: { windows: '/downloads/setup.exe' } })

    expect(res.status).toBe(400)
    expect(await fieldsOf(res)).toContain('downloads.windows')
  })

  it('reports every problem at once', async () => {
    const res = await publish({ version: 'nope', releaseDate: 'nope', downloads: 'nope' })

    expect((await res.json()).details).toHaveLength(3)
  })

  it('rejects an oversized body before parsing it', async () => {
    const request = new Request('http://localhost/api/releases/latest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': String(1024 * 1024),
      },
      body: JSON.stringify(validPayload),
    })

    const res = await publishRelease(request, { repository, ciReleaseToken: TOKEN })
    expect(res.status).toBe(413)
  })
})

describe('upsert', () => {
  it('creates a release with 201 and echoes it back', async () => {
    const res = await publish(validPayload)

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      created: true,
      release: {
        version: '1.2.3',
        releaseDate: '2026-08-11T12:00:00.000Z',
        notes: 'Bug fixes and performance improvements.',
        downloads: validPayload.downloads,
      },
    })
  })

  it('updates in place when the version already exists', async () => {
    await publish(validPayload)
    const res = await publish({
      ...validPayload,
      notes: 'Re-published with a fixed macOS build.',
      downloads: { macos: 'https://example.com/AmaliScribe-1.2.3-fixed.dmg' },
    })

    expect(res.status).toBe(200)
    expect((await res.json()).created).toBe(false)

    const releases = await listed()
    expect(releases).toHaveLength(1)
    expect(releases[0]).toMatchObject({
      version: '1.2.3',
      notes: 'Re-published with a fixed macOS build.',
      downloads: { macos: 'https://example.com/AmaliScribe-1.2.3-fixed.dmg' },
    })
  })

  it('clears platforms omitted by a re-publish', async () => {
    await publish(validPayload)
    await publish({ ...validPayload, downloads: { windows: validPayload.downloads.windows } })

    expect(Object.keys((await listed())[0].downloads)).toEqual(['windows'])
  })

  it('is idempotent for repeated identical calls', async () => {
    await publish(validPayload)
    await publish(validPayload)
    await publish(validPayload)

    expect(await listed()).toHaveLength(1)
  })
})

describe('reading releases', () => {
  const publishMany = async (entries: [string, string][]) => {
    for (const [version, releaseDate] of entries) {
      await publish({
        version,
        releaseDate,
        notes: `Notes for ${version}`,
        downloads: { windows: `https://example.com/AmaliScribe-${version}-setup.exe` },
      })
    }
  }

  it('returns an empty list when nothing is published', async () => {
    expect(await listed()).toEqual([])
  })

  it('orders releases newest-first by release date', async () => {
    await publishMany([
      ['1.9.0', '2026-05-01T09:00:00Z'],
      ['1.10.0', '2026-06-01T09:00:00Z'],
      ['1.2.3', '2026-01-15T09:00:00Z'],
      ['2.0.0', '2026-07-20T09:00:00Z'],
    ])

    expect((await listed()).map((r: { version: string }) => r.version)).toEqual([
      '2.0.0',
      '1.10.0',
      '1.9.0',
      '1.2.3',
    ])
  })

  it('breaks release-date ties by semver, not string order', async () => {
    const sameDay = '2026-03-03T00:00:00Z'
    await publishMany([
      ['1.9.0', sameDay],
      ['1.10.0', sameDay],
      ['1.10.1', sameDay],
    ])

    expect((await listed()).map((r: { version: string }) => r.version)).toEqual([
      '1.10.1',
      '1.10.0',
      '1.9.0',
    ])
  })

  it('omits platforms that have no artifact', async () => {
    await publish({ ...validPayload, downloads: { linux: validPayload.downloads.linux } })

    expect((await listed())[0].downloads).toEqual({ linux: validPayload.downloads.linux })
  })

  it('never leaks the CI token', async () => {
    await publish(validPayload)

    expect(JSON.stringify(await listed())).not.toContain(TOKEN)
  })

  it('404s on the latest endpoint when nothing is published', async () => {
    const res = await latestRelease(repository)

    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('not_found')
  })

  it('returns the newest release from the latest endpoint', async () => {
    await publishMany([
      ['1.0.0', '2026-01-01T00:00:00Z'],
      ['1.1.0', '2026-02-01T00:00:00Z'],
    ])

    const res = await latestRelease(repository)
    expect(res.status).toBe(200)
    expect((await res.json()).release.version).toBe('1.1.0')
  })
})
