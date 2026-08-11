import type { ApiError, ValidationIssue } from './release'
import type { ReleaseRepository } from './releases'
import { parseReleaseInput } from './validation'

/**
 * Request handlers for the release API, written against the web `Request`/
 * `Response` types. Next's route handlers are thin wrappers over these, which
 * keeps them directly unit-testable without a running server.
 *
 * Deliberately free of Node built-ins (`node:crypto`, `Buffer`) so these run
 * unchanged on the edge runtime as well as in a Node serverless function.
 */

const MAX_BODY_BYTES = 64 * 1024

export function failure(
  status: number,
  error: string,
  message: string,
  details?: ValidationIssue[],
): Response {
  const body: ApiError = { error, message }
  if (details) body.details = details
  return Response.json(body, { status })
}

export async function listReleases(repository: ReleaseRepository): Promise<Response> {
  try {
    return Response.json({ releases: await repository.list() })
  } catch (error) {
    console.error('Failed to read releases:', error)
    return failure(500, 'internal_error', 'The release list could not be read.')
  }
}

export async function latestRelease(repository: ReleaseRepository): Promise<Response> {
  try {
    const release = await repository.latest()
    if (!release) {
      return failure(404, 'not_found', 'No releases have been published yet.')
    }
    return Response.json({ release })
  } catch (error) {
    console.error('Failed to read the latest release:', error)
    return failure(500, 'internal_error', 'The latest release could not be read.')
  }
}

export interface PublishOptions {
  repository: ReleaseRepository
  /** Shared secret CI presents as `Authorization: Bearer <token>`. Server-side only. */
  ciReleaseToken: string
}

/**
 * Creates or updates a single release. Idempotent by version: re-publishing an
 * existing version replaces it (200) rather than duplicating it (201).
 */
export async function publishRelease(
  request: Request,
  { repository, ciReleaseToken }: PublishOptions,
): Promise<Response> {
  // Authorization is checked before the body is touched, so an unauthenticated
  // payload is never parsed or inspected.
  const denied = checkAuthorization(request, ciReleaseToken)
  if (denied) return denied

  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return failure(
      413,
      'payload_too_large',
      `Request body exceeds ${MAX_BODY_BYTES} bytes.`,
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return failure(400, 'invalid_json', 'Request body is not valid JSON.')
  }

  const parsed = parseReleaseInput(body)
  if (!parsed.ok) {
    return failure(400, 'validation_failed', 'The release payload is invalid.', parsed.issues)
  }

  try {
    const { created, release } = await repository.upsert(parsed.value)
    return Response.json({ created, release }, { status: created ? 201 : 200 })
  } catch (error) {
    console.error('Failed to persist release:', error)
    return failure(500, 'internal_error', 'The release could not be stored.')
  }
}

/** Returns a response when the request should be rejected, otherwise `null`. */
function checkAuthorization(request: Request, expected: string): Response | null {
  if (!expected) {
    console.error('CI_RELEASE_TOKEN is not configured; refusing to accept publishes.')
    return failure(
      500,
      'server_misconfigured',
      'The server has no CI release token configured.',
    )
  }

  const header = request.headers.get('authorization') ?? ''
  const [scheme, ...rest] = header.split(' ')
  const presented = rest.join(' ').trim()

  if (scheme.toLowerCase() !== 'bearer' || presented === '' || !tokensMatch(presented, expected)) {
    return Response.json(
      { error: 'unauthorized', message: 'A valid CI bearer token is required.' } satisfies ApiError,
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="amaliscribe-releases"' } },
    )
  }

  return null
}

const utf8 = new TextEncoder()

/**
 * Constant-time comparison, without `node:crypto` so it works on the edge
 * runtime. Every byte is always compared; only the length check short-circuits,
 * which is the same guarantee `timingSafeEqual` gives.
 */
function tokensMatch(presented: string, expected: string): boolean {
  const a = utf8.encode(presented)
  const b = utf8.encode(expected)
  if (a.length !== b.length) return false

  let difference = 0
  for (let i = 0; i < a.length; i += 1) {
    difference |= a[i] ^ b[i]
  }
  return difference === 0
}
