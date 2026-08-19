import type { Release } from '@/lib/release'
import { formatReleaseDate } from '@/lib/format'
import { DownloadList } from './DownloadList'

interface ReleaseCardProps {
  release: Release
}

/**
 * One entry in the release history list. Deliberately a single compact row —
 * the history can run long, so the notes are clamped and the downloads collapse
 * to inline chips rather than the full-height rows used for the latest release.
 */
export function ReleaseCard({ release }: ReleaseCardProps) {
  const headingId = `release-${release.version.replace(/[^\w.-]/g, '-')}`

  return (
    <li>
      <article className="release" aria-labelledby={headingId}>
        <div className="release__head">
          <h3
            className="release__version"
            id={headingId}
            aria-label={`Version ${release.version}`}
          >
            {release.version}
          </h3>
          <p className="release__date">
            <time dateTime={release.releaseDate}>{formatReleaseDate(release.releaseDate)}</time>
          </p>
        </div>

        {release.notes ? (
          <p className="notes release__notes">{release.notes}</p>
        ) : (
          <p className="notes notes--empty release__notes">No release notes were published.</p>
        )}

        <div className="release__downloads">
          <h4 className="visually-hidden">Downloads for {release.version}</h4>
          <DownloadList version={release.version} downloads={release.downloads} variant="chip" />
        </div>
      </article>
    </li>
  )
}
