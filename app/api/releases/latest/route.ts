import { latestRelease, publishRelease } from '@/lib/api'
import { getReleaseRepository } from '@/lib/store'

export const dynamic = 'force-dynamic'

export function GET(): Promise<Response> {
  return latestRelease(getReleaseRepository())
}

/** Protected endpoint CI calls after a successful cross-platform build. */
export function POST(request: Request): Promise<Response> {
  return publishRelease(request, {
    repository: getReleaseRepository(),
    ciReleaseToken: process.env.CI_RELEASE_TOKEN ?? '',
  })
}
