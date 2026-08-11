import { headers } from 'next/headers'
import { ReleasePortal } from '@/components/ReleasePortal'
import { detectPlatform } from '@/lib/platform'
import { getReleaseRepository } from '@/lib/store'

/**
 * The portal is a server component: it queries Turso directly at request time,
 * so there is no client-side fetch, no loading state and no separate API origin.
 *
 * Runs on the default `nodejs` runtime, which deploys as a serverless function —
 * no long-running server and no local disk. The code holds no Node built-ins, so
 * it also builds cleanly under `runtime = 'edge'` if a target needs that; Next 16
 * deprecates that runtime, hence the default here.
 */
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [releases, requestHeaders] = await Promise.all([
    getReleaseRepository().list(),
    headers(),
  ])

  return <ReleasePortal releases={releases} detected={detectPlatform(requestHeaders.get('user-agent'))} />
}
