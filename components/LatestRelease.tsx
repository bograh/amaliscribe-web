import { PLATFORM_LABELS, type Platform, type Release } from '@/lib/release'
import { formatReleaseDate } from '@/lib/format'
import { DownloadList } from './DownloadList'

interface LatestReleaseProps {
  release: Release
  /** Guessed visitor OS; only decides which row gets top billing. */
  detected: Platform | null
}

/** The featured card for the newest release. */
export function LatestRelease({ release, detected }: LatestReleaseProps) {
  const promoted = detected && release.downloads[detected] ? detected : null

  return (
    <article className="latest__card" aria-labelledby="latest-heading">
      <div className="latest__meta">
        <p>
          <span className="tag">Latest release</span>
        </p>

        {/* Labelled explicitly: the visible text is a bare version number,
            which reads poorly on its own. */}
        <h2
          className="latest__version"
          id="latest-heading"
          aria-label={`AmaliScribe version ${release.version}`}
        >
          <span>{release.version}</span>
        </h2>

        <p className="latest__date">
          Published{' '}
          <time dateTime={release.releaseDate}>{formatReleaseDate(release.releaseDate)}</time>
        </p>

        <div className="latest__notes">
          <h3 className="latest__notes-label">What&rsquo;s new</h3>
          {release.notes ? (
            <p className="notes">{release.notes}</p>
          ) : (
            <p className="notes notes--empty">
              No release notes were published for this version.
            </p>
          )}
        </div>
      </div>

      <div className="picker">
        <h3 className="picker__label">
          {promoted ? `Recommended for ${PLATFORM_LABELS[promoted]}` : 'Choose your platform'}
        </h3>
        <DownloadList
          version={release.version}
          downloads={release.downloads}
          featured={promoted}
        />
      </div>
    </article>
  )
}
