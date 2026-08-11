const LONG_DATE = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

/** Human-readable publish date; falls back to the raw value if unparseable. */
export function formatReleaseDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : LONG_DATE.format(date)
}
