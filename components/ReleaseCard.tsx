import type { Release } from '@/lib/release'
import { formatReleaseDate } from '@/lib/format'
import { DownloadList } from './DownloadList'

interface ReleaseCardProps {
  release: Release
}

/** One entry in the release history list. */
export function ReleaseCard({ release }: ReleaseCardProps) {
  const headingId = `release-${release.version.replace(/[^\w.-]/g, '-')}`

  return (
    <li>
      <article className="release" aria-labelledby={headingId}>
        <div>
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

          <div className="release__notes">
            {release.notes ? (
              <p className="notes">{release.notes}</p>
            ) : (
              <p className="notes notes--empty">
                No release notes were published for this version.
              </p>
            )}
          </div>
        </div>

        <div>
          <h4 className="visually-hidden">Downloads for {release.version}</h4>
          <DownloadList version={release.version} downloads={release.downloads} />
        </div>
      </article>
    </li>
  )
}
