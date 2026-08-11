import { PLATFORMS, type Downloads, type Platform, type ValidationIssue } from './release'

/** A validated, normalised release ready to be persisted. */
export interface ReleaseInput {
  version: string
  releaseDate: string
  notes: string | null
  downloads: Downloads
}

export type ValidationResult =
  | { ok: true; value: ReleaseInput }
  | { ok: false; issues: ValidationIssue[] }

/** `MAJOR.MINOR.PATCH` with optional pre-release and build metadata. */
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

const MAX_NOTES_LENGTH = 20_000
const MAX_URL_LENGTH = 2_048

const isPlatform = (key: string): key is Platform => (PLATFORMS as readonly string[]).includes(key)

/**
 * Validates a `POST /api/releases/latest` body, collecting every problem so CI
 * logs show all of them at once instead of one per retry.
 */
export function parseReleaseInput(body: unknown): ValidationResult {
  const issues: ValidationIssue[] = []

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, issues: [{ field: 'body', message: 'Expected a JSON object.' }] }
  }

  const raw = body as Record<string, unknown>

  const version = parseVersion(raw.version, issues)
  const releaseDate = parseReleaseDate(raw.releaseDate, issues)
  const notes = parseNotes(raw.notes, issues)
  const downloads = parseDownloads(raw.downloads, issues)

  if (issues.length > 0) return { ok: false, issues }

  return {
    ok: true,
    value: {
      version: version as string,
      releaseDate: releaseDate as string,
      notes,
      downloads: downloads as Downloads,
    },
  }
}

function parseVersion(value: unknown, issues: ValidationIssue[]): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    issues.push({ field: 'version', message: 'Required. Expected a semver string, e.g. "1.2.3".' })
    return
  }

  const version = value.trim()
  if (!SEMVER.test(version)) {
    issues.push({
      field: 'version',
      message: `"${version}" is not valid semver. Expected MAJOR.MINOR.PATCH, e.g. "1.2.3" or "2.0.0-beta.1".`,
    })
    return
  }

  return version
}

function parseReleaseDate(value: unknown, issues: ValidationIssue[]): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    issues.push({
      field: 'releaseDate',
      message: 'Required. Expected an ISO 8601 timestamp, e.g. "2026-08-11T12:00:00Z".',
    })
    return
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    issues.push({
      field: 'releaseDate',
      message: `"${value}" is not a parseable ISO 8601 timestamp.`,
    })
    return
  }

  return parsed.toISOString()
}

function parseNotes(value: unknown, issues: ValidationIssue[]): string | null {
  if (value === undefined || value === null || value === '') return null

  if (typeof value !== 'string') {
    issues.push({ field: 'notes', message: 'Expected a string when present.' })
    return null
  }

  if (value.length > MAX_NOTES_LENGTH) {
    issues.push({
      field: 'notes',
      message: `Too long: ${value.length} characters (limit ${MAX_NOTES_LENGTH}).`,
    })
    return null
  }

  return value.trim() === '' ? null : value.trim()
}

function parseDownloads(value: unknown, issues: ValidationIssue[]): Downloads | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    issues.push({
      field: 'downloads',
      message: `Required. Expected an object with at least one of: ${PLATFORMS.join(', ')}.`,
    })
    return
  }

  const downloads: Downloads = {}
  const before = issues.length

  for (const [key, url] of Object.entries(value as Record<string, unknown>)) {
    if (!isPlatform(key)) {
      issues.push({
        field: `downloads.${key}`,
        message: `Unknown platform. Expected one of: ${PLATFORMS.join(', ')}.`,
      })
      continue
    }

    if (url === undefined || url === null || url === '') continue

    const problem = urlProblem(url)
    if (problem) {
      issues.push({ field: `downloads.${key}`, message: problem })
      continue
    }

    downloads[key] = (url as string).trim()
  }

  if (issues.length === before && Object.keys(downloads).length === 0) {
    issues.push({
      field: 'downloads',
      message: `At least one artifact URL is required (${PLATFORMS.join(', ')}).`,
    })
    return
  }

  return downloads
}

function urlProblem(value: unknown): string | null {
  if (typeof value !== 'string') return 'Expected an absolute http(s) URL string.'
  if (value.length > MAX_URL_LENGTH) return `Too long (limit ${MAX_URL_LENGTH} characters).`

  let parsed: URL
  try {
    parsed = new URL(value.trim())
  } catch {
    return `"${value}" is not an absolute URL. Download links must point directly at a CI artifact.`
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return `Unsupported protocol "${parsed.protocol}". Expected https (or http for local testing).`
  }

  return null
}

/**
 * Builds a lexicographically sortable key from a semver string so SQLite can
 * order `1.10.0` above `1.9.0`. Release builds sort above their pre-releases.
 *
 * Pre-release identifiers are compared as text, so `beta.10` sorts below
 * `beta.2`. That only affects tie-breaking between pre-releases published on
 * the same timestamp; swap in a real semver comparator if that ever matters.
 */
export function versionSortKey(version: string): string {
  const withoutBuild = version.split('+')[0]
  const dash = withoutBuild.indexOf('-')
  const core = dash === -1 ? withoutBuild : withoutBuild.slice(0, dash)
  const prerelease = dash === -1 ? undefined : withoutBuild.slice(dash + 1)

  const numeric = core
    .split('.')
    .map((part) => part.padStart(6, '0'))
    .join('.')

  // "~" sorts after every alphanumeric character in ASCII, so a plain release
  // outranks any of its pre-releases.
  return `${numeric}-${prerelease ? prerelease.padEnd(24, ' ') : '~'}`
}
