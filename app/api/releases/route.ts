import { listReleases } from '@/lib/api'
import { getReleaseRepository } from '@/lib/store'

/** Queries Turso on every request, so a fresh publish shows up at once. */
export const dynamic = 'force-dynamic'

export function GET(): Promise<Response> {
  return listReleases(getReleaseRepository())
}
