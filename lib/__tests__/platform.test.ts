import { describe, expect, it } from 'vitest'
import { artifactFilename, detectPlatform } from '../platform'

describe('detectPlatform', () => {
  it.each([
    ['windows', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140'],
    ['macos', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605'],
    ['linux', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140'],
  ])('detects %s', (expected, userAgent) => {
    expect(detectPlatform(userAgent)).toBe(expected)
  })

  it.each([
    ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1'],
    ['Android', 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140'],
  ])('returns null for %s, which has no desktop build', (_name, userAgent) => {
    expect(detectPlatform(userAgent)).toBeNull()
  })

  it('returns null when the User-Agent is missing', () => {
    expect(detectPlatform(null)).toBeNull()
    expect(detectPlatform(undefined)).toBeNull()
    expect(detectPlatform('')).toBeNull()
  })
})

describe('artifactFilename', () => {
  it('takes the trailing path segment', () => {
    expect(artifactFilename('https://ci.example.com/v1.2.3/AmaliScribe-1.2.3-setup.exe')).toBe(
      'AmaliScribe-1.2.3-setup.exe',
    )
  })

  it('decodes percent-encoded names', () => {
    expect(artifactFilename('https://ci.example.com/AmaliScribe%201.2.3.dmg')).toBe(
      'AmaliScribe 1.2.3.dmg',
    )
  })

  it('returns null when there is no filename to show', () => {
    expect(artifactFilename('https://ci.example.com/')).toBeNull()
    expect(artifactFilename('not a url')).toBeNull()
  })
})
