import { PLATFORM_LABELS, type Platform } from '@/lib/release'
import { PLATFORM_ARTIFACT_HINT, artifactFilename } from '@/lib/platform'
import { ArrowDownIcon, PlatformIcon } from './icons'

interface DownloadLinkProps {
  platform: Platform
  /** Direct link to the CI-produced installer artifact. */
  url: string
  version: string
  /** Emphasised variant used for the visitor's detected platform. */
  featured?: boolean
  /**
   * `row` is the tall variant used on the latest-release card; `chip` is the
   * single-line pill used in the release history, where vertical space matters
   * more than showing the filename inline.
   */
  variant?: 'row' | 'chip'
}

export function DownloadLink({
  platform,
  url,
  version,
  featured = false,
  variant = 'row',
}: DownloadLinkProps) {
  const label = PLATFORM_LABELS[platform]
  const filename = artifactFilename(url)
  const chip = variant === 'chip'

  return (
    <a
      className={['dl', chip && 'dl--chip', featured && 'dl--featured'].filter(Boolean).join(' ')}
      // Spelled out in full because the visible text is deliberately terse.
      aria-label={`Download AmaliScribe ${version} for ${label}${filename ? ` (${filename})` : ''}`}
      // The chip variant drops the visible filename, so surface it on hover.
      title={chip ? (filename ?? PLATFORM_ARTIFACT_HINT[platform]) : undefined}
      href={url}
      // Cross-origin artifact host, so the browser drives the download; the
      // attribute is advisory only.
      download={filename ?? undefined}
      data-platform={platform}
    >
      <span className="dl__glyph">
        <PlatformIcon platform={platform} />
      </span>
      <span>
        <span className="dl__label">
          {featured && !chip ? `Download for ${label}` : label}
        </span>
        {!chip && <span className="dl__file">{filename ?? PLATFORM_ARTIFACT_HINT[platform]}</span>}
      </span>
      <ArrowDownIcon className="dl__arrow" />
    </a>
  )
}
