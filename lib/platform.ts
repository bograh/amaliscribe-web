import type { Platform } from './release'

/** Extension shown alongside download buttons so users know what they get. */
export const PLATFORM_ARTIFACT_HINT: Record<Platform, string> = {
  windows: 'Windows installer (.exe)',
  macos: 'macOS disk image (.dmg)',
  linux: 'Linux AppImage',
}

/**
 * Best-effort guess at the visitor's OS from their `User-Agent`, so the page can
 * promote one obvious download. Runs on the server during render, which keeps
 * the whole page a server component — no client-side detection flash.
 *
 * Never load-bearing: every platform with an artifact is always listed.
 */
export function detectPlatform(userAgent: string | null | undefined): Platform | null {
  if (!userAgent) return null

  const ua = userAgent.toLowerCase()

  // Order matters: mobile OSes are Unix-like and have no desktop build, and
  // Android user agents also contain "linux".
  if (/iphone|ipad|ipod|android/.test(ua)) return null
  if (/windows|win32|win64/.test(ua)) return 'windows'
  if (/mac os|macintosh|darwin/.test(ua)) return 'macos'
  if (/linux|x11|cros|bsd/.test(ua)) return 'linux'
  return null
}

/** The trailing filename of an artifact URL, e.g. `AmaliScribe-1.2.3-setup.exe`. */
export function artifactFilename(url: string): string | null {
  try {
    const name = new URL(url).pathname.split('/').filter(Boolean).pop()
    return name ? decodeURIComponent(name) : null
  } catch {
    return null
  }
}
