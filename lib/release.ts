/**
 * Types shared by the Express API and the React frontend.
 *
 * Kept deliberately small: a release is a version, a date, optional notes and
 * a sparse map of per-platform installer URLs. Platforms missing from
 * `downloads` have no artifact for that release and are hidden in the UI.
 */

export const PLATFORMS = ['windows', 'macos', 'linux'] as const

export type Platform = (typeof PLATFORMS)[number]

export type Downloads = Partial<Record<Platform, string>>

export interface Release {
  version: string
  /** ISO 8601 timestamp in UTC, e.g. `2026-08-11T12:00:00.000Z`. */
  releaseDate: string
  notes: string | null
  downloads: Downloads
}

export interface ReleaseListResponse {
  releases: Release[]
}

export interface ValidationIssue {
  field: string
  message: string
}

export interface ApiError {
  error: string
  message: string
  details?: ValidationIssue[]
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
}
