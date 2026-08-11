import { PLATFORMS, type Downloads, type Platform } from '@/lib/release'
import { DownloadLink } from './DownloadLink'

interface DownloadListProps {
  version: string
  downloads: Downloads
  /** Platform to promote to the top and render as the featured row. */
  featured?: Platform | null
}

/**
 * One row per platform that actually has an artifact. Platforms missing from
 * `downloads` are omitted entirely rather than shown disabled.
 */
export function DownloadList({ version, downloads, featured = null }: DownloadListProps) {
  const available = PLATFORMS.filter((platform) => Boolean(downloads[platform]))
  if (available.length === 0) return null

  const promoted = featured && downloads[featured] ? featured : null
  const ordered = promoted
    ? [promoted, ...available.filter((platform) => platform !== promoted)]
    : available

  return (
    <ul className="picker__list">
      {ordered.map((platform) => (
        <li key={platform}>
          <DownloadLink
            platform={platform}
            url={downloads[platform] as string}
            version={version}
            featured={platform === promoted}
          />
        </li>
      ))}
    </ul>
  )
}
