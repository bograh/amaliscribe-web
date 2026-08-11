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
}

export function DownloadLink({ platform, url, version, featured = false }: DownloadLinkProps) {
  const label = PLATFORM_LABELS[platform]
  const filename = artifactFilename(url)

  return (
    <a
      className={featured ? 'dl dl--featured' : 'dl'}
      // Spelled out in full because the visible text is deliberately terse.
      aria-label={`Download AmaliScribe ${version} for ${label}${filename ? ` (${filename})` : ''}`}
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
          {featured ? `Download for ${label}` : label}
        </span>
        <span className="dl__file">{filename ?? PLATFORM_ARTIFACT_HINT[platform]}</span>
      </span>
      <ArrowDownIcon className="dl__arrow" />
    </a>
  )
}
