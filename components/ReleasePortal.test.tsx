import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Platform, Release } from '@/lib/release'
import { ReleasePortal } from './ReleasePortal'

const release = (version: string, releaseDate: string, notes: string | null = null): Release => ({
  version,
  releaseDate,
  notes,
  downloads: {
    windows: `https://ci.example.com/AmaliScribe-${version}-setup.exe`,
    macos: `https://ci.example.com/AmaliScribe-${version}.dmg`,
    linux: `https://ci.example.com/AmaliScribe-${version}.AppImage`,
  },
})

/** The API orders releases, so the fixture is already newest-first. */
const RELEASES = [
  release('2.0.0', '2026-07-20T09:00:00Z', 'Local summarisation.'),
  release('1.10.0', '2026-06-01T09:00:00Z'),
  release('1.9.0', '2026-05-01T09:00:00Z'),
]

const renderPortal = (releases: Release[] = RELEASES, detected: Platform | null = 'windows') =>
  render(<ReleasePortal releases={releases} detected={detected} />)

describe('ReleasePortal', () => {
  it('explains the local-first value proposition', () => {
    renderPortal()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/never leave your laptop/i)
    expect(screen.getAllByText(/whisper\.cpp/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /self-hosted, no account/i })).toBeInTheDocument()
  })

  it('features the newest release', () => {
    renderPortal()

    const latest = screen.getByRole('article', { name: /version 2\.0\.0/i })
    expect(within(latest).getByText(/latest release/i)).toBeInTheDocument()
    expect(within(latest).getByText('Local summarisation.')).toBeInTheDocument()
  })

  it('promotes the detected platform as the featured download', () => {
    renderPortal()

    const latest = screen.getByRole('article', { name: /version 2\.0\.0/i })
    const links = within(latest).getAllByRole('link')

    expect(links[0]).toHaveAttribute('href', 'https://ci.example.com/AmaliScribe-2.0.0-setup.exe')
    expect(links[0]).toHaveClass('dl--featured')
    expect(within(latest).getByText(/recommended for windows/i)).toBeInTheDocument()
  })

  it('still offers every platform when the OS cannot be detected', () => {
    renderPortal(RELEASES, null)

    const latest = screen.getByRole('article', { name: /version 2\.0\.0/i })
    expect(within(latest).getByText(/choose your platform/i)).toBeInTheDocument()
    for (const label of ['Windows', 'macOS', 'Linux']) {
      expect(
        within(latest).getByRole('link', { name: new RegExp(`2\\.0\\.0 for ${label}`) }),
      ).toBeInTheDocument()
    }
    expect(within(latest).queryByRole('link', { name: /Download for/ })).not.toBeInTheDocument()
  })

  it('does not promote a platform the latest release has no build for', () => {
    const linuxOnly: Release = {
      ...release('3.0.0', '2026-09-01T00:00:00Z'),
      downloads: { linux: 'https://ci.example.com/AmaliScribe-3.0.0.AppImage' },
    }
    renderPortal([linuxOnly], 'windows')

    const latest = screen.getByRole('article', { name: /version 3\.0\.0/i })
    expect(within(latest).getByText(/choose your platform/i)).toBeInTheDocument()
    expect(within(latest).getAllByRole('link')).toHaveLength(1)
  })

  it('lists earlier releases newest-first, without repeating the latest', () => {
    renderPortal()

    const history = screen.getByRole('list', { name: /earlier releases/i })
    const versions = within(history)
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent?.trim())

    expect(versions).toEqual(['1.10.0', '1.9.0'])
  })

  it('shows an empty state before the first release is published', () => {
    renderPortal([])

    expect(screen.getByText(/no releases published yet/i)).toBeInTheDocument()
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('explains that a single release has no history yet', () => {
    renderPortal([RELEASES[0]])

    expect(screen.getByText(/2\.0\.0 is the only release so far/i)).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /earlier releases/i })).not.toBeInTheDocument()
  })

  it('exposes navigation landmarks and a skip link', () => {
    renderPortal()

    expect(screen.getByRole('link', { name: /skip to downloads/i })).toHaveAttribute(
      'href',
      '#downloads',
    )
    expect(screen.getByRole('navigation', { name: /page sections/i })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('shows the current version in the hero call to action', () => {
    renderPortal()

    expect(screen.getByText(/version 2\.0\.0 · available for/i)).toBeInTheDocument()
  })
})
