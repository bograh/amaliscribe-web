import type { Client } from './db'
import type { Downloads, Release } from './release'
import { versionSortKey, type ReleaseInput } from './validation'

interface ReleaseRow {
  version: string
  release_date: string
  notes: string | null
  windows_url: string | null
  macos_url: string | null
  linux_url: string | null
}

const SELECT_COLUMNS = `version, release_date, notes, windows_url, macos_url, linux_url`
const NEWEST_FIRST = `ORDER BY release_date DESC, version_sort DESC`

/**
 * All release persistence lives here so route handlers stay thin and the
 * storage engine stays swappable. Every method is async because libSQL talks to
 * Turso over HTTP.
 */
export class ReleaseRepository {
  readonly #client: Client

  constructor(client: Client) {
    this.#client = client
  }

  /**
   * Creates the release, or replaces it wholesale if the version already
   * exists. Returns whether a new row was created so the route can answer
   * 201 vs 200.
   */
  async upsert(input: ReleaseInput): Promise<{ created: boolean; release: Release }> {
    const now = new Date().toISOString()
    const args = {
      version: input.version,
      versionSort: versionSortKey(input.version),
      releaseDate: input.releaseDate,
      notes: input.notes,
      windows: input.downloads.windows ?? null,
      macos: input.downloads.macos ?? null,
      linux: input.downloads.linux ?? null,
      now,
    }

    // A batch runs as one transaction, so the existence probe and the write
    // cannot interleave with a concurrent publish of the same version.
    const [probe] = await this.#client.batch(
      [
        { sql: `SELECT 1 FROM releases WHERE version = :version`, args: { version: input.version } },
        {
          sql: `INSERT INTO releases (
                  version, version_sort, release_date, notes,
                  windows_url, macos_url, linux_url, created_at, updated_at
                ) VALUES (
                  :version, :versionSort, :releaseDate, :notes,
                  :windows, :macos, :linux, :now, :now
                )
                ON CONFLICT(version) DO UPDATE SET
                  version_sort = excluded.version_sort,
                  release_date = excluded.release_date,
                  notes        = excluded.notes,
                  windows_url  = excluded.windows_url,
                  macos_url    = excluded.macos_url,
                  linux_url    = excluded.linux_url,
                  updated_at   = excluded.updated_at`,
          args,
        },
      ],
      'write',
    )

    return {
      created: probe.rows.length === 0,
      release: {
        version: input.version,
        releaseDate: input.releaseDate,
        notes: input.notes,
        downloads: input.downloads,
      },
    }
  }

  /** Every release, newest-first. */
  async list(): Promise<Release[]> {
    const result = await this.#client.execute(
      `SELECT ${SELECT_COLUMNS} FROM releases ${NEWEST_FIRST}`,
    )
    return (result.rows as unknown as ReleaseRow[]).map(toRelease)
  }

  /** The newest release, or `null` when nothing has been published yet. */
  async latest(): Promise<Release | null> {
    const result = await this.#client.execute(
      `SELECT ${SELECT_COLUMNS} FROM releases ${NEWEST_FIRST} LIMIT 1`,
    )
    const row = (result.rows as unknown as ReleaseRow[])[0]
    return row ? toRelease(row) : null
  }
}

/** Absent platform URLs are dropped so the UI can hide those buttons. */
function toRelease(row: ReleaseRow): Release {
  const downloads: Downloads = {}
  if (row.windows_url) downloads.windows = row.windows_url
  if (row.macos_url) downloads.macos = row.macos_url
  if (row.linux_url) downloads.linux = row.linux_url

  return {
    version: row.version,
    releaseDate: row.release_date,
    notes: row.notes,
    downloads,
  }
}
