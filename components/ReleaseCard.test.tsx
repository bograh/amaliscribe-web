import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Release } from '@/lib/release'
import { ReleaseCard } from './ReleaseCard'

const release: Release = {
  version: '1.2.3',
  releaseDate: '2026-08-11T12:00:00.000Z',
  notes: 'Bug fixes and performance improvements.',
  downloads: {
    windows: 'https://example.com/AmaliScribe-1.2.3-setup.exe',
    macos: 'https://example.com/AmaliScribe-1.2.3.dmg',
    linux: 'https://example.com/AmaliScribe-1.2.3.AppImage',
  },
}

// The date is rendered in the visitor's locale, so match either common order
// rather than pinning the test machine's ICU default.
const PUBLISH_DATE = /^(11 August 2026|August 11, 2026)$/

const renderCard = (overrides: Partial<Release> = {}) =>
  render(
    <ul>
      <ReleaseCard release={{ ...release, ...overrides }} />
    </ul>,
  )

describe('ReleaseCard', () => {
  it('shows the version, publish date and notes', () => {
    renderCard()

    expect(screen.getByRole('heading', { level: 3, name: /1\.2\.3/ })).toBeInTheDocument()
    expect(screen.getByText(PUBLISH_DATE)).toBeInTheDocument()
    expect(screen.getByText('Bug fixes and performance improvements.')).toBeInTheDocument()
  })

  it('exposes the publish date as a machine-readable time', () => {
    renderCard()

    expect(screen.getByText(PUBLISH_DATE).closest('time')).toHaveAttribute(
      'datetime',
      '2026-08-11T12:00:00.000Z',
    )
  })

  it('says so explicitly when a release has no notes', () => {
    renderCard({ notes: null })

    expect(screen.getByText(/no release notes were published/i)).toBeInTheDocument()
  })

  it('links each platform straight at its CI artifact', () => {
    renderCard()

    expect(screen.getByRole('link', { name: /for Windows/ })).toHaveAttribute(
      'href',
      release.downloads.windows,
    )
    expect(screen.getByRole('link', { name: /for macOS/ })).toHaveAttribute(
      'href',
      release.downloads.macos,
    )
    expect(screen.getByRole('link', { name: /for Linux/ })).toHaveAttribute(
      'href',
      release.downloads.linux,
    )
  })

  it('hides the download link for a platform with no artifact', () => {
    renderCard({ downloads: { windows: release.downloads.windows } })

    expect(screen.getByRole('link', { name: /for Windows/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /for macOS/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /for Linux/ })).not.toBeInTheDocument()
  })

  it('renders no download links at all when every artifact is missing', () => {
    renderCard({ downloads: {} })

    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  it('announces the version and filename on each download link', () => {
    renderCard()

    expect(
      screen.getByRole('link', {
        name: 'Download AmaliScribe 1.2.3 for Windows (AmaliScribe-1.2.3-setup.exe)',
      }),
    ).toBeInTheDocument()
  })

  it('shows the artifact filename so users know what they are getting', () => {
    renderCard()

    expect(screen.getByText('AmaliScribe-1.2.3.dmg')).toBeInTheDocument()
  })
})
