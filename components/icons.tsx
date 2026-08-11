import type { ReactElement, SVGProps } from 'react'
import type { Platform } from '@/lib/release'

/**
 * Inline, `currentColor`-driven icons. Decorative by default (`aria-hidden`), so
 * surrounding text carries the meaning for assistive technology.
 */
type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  )
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function WindowsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M3 5.4 10.4 4.4v7.1H3zM11.6 4.2 21 3v8.5h-9.4zM3 12.5h7.4v7.1L3 18.6zM11.6 12.5H21V21l-9.4-1.2z"
      />
    </Icon>
  )
}

export function MacosIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M16.3 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.4.7-3 .7s-1.6-.7-2.6-.7c-1.3 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2 2.5 2s1.3-.6 2.5-.6 1.5.6 2.5.6 1.7-1 2.4-2c.5-.7.7-1.1 1.1-1.9-2.6-1-2.4-3.2-2.4-3.2zM14.6 6.4c.5-.7.9-1.6.8-2.6-.8 0-1.8.6-2.4 1.3-.5.6-1 1.6-.8 2.5.9.1 1.8-.5 2.4-1.2z"
      />
    </Icon>
  )
}

export function LinuxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M12 2c-2.3 0-3.6 1.7-3.5 4.2.1 1.5-.2 2.3-1.1 3.7-1.2 1.8-1.7 3-2.4 4.8-.4 1.1-.6 2 .1 2.4.6.4 1.3-.1 1.8.5.6.8 1.2 2.2 2.6 2.6 1.6.5 3.4.5 5 0 1.4-.4 2-1.8 2.6-2.6.5-.6 1.2-.1 1.8-.5.7-.4.5-1.3.1-2.4-.7-1.8-1.2-3-2.4-4.8-.9-1.4-1.2-2.2-1.1-3.7C15.6 3.7 14.3 2 12 2zm-1.4 3.1c.5 0 .8.5.8 1.1s-.4 1.1-.8 1.1-.9-.5-.9-1.1.4-1.1.9-1.1zm2.9 0c.5 0 .9.5.9 1.1s-.4 1.1-.9 1.1-.8-.5-.8-1.1.3-1.1.8-1.1zM12 8.3c.9 0 2.1.6 2.1 1.1 0 .4-1.2 1.4-2.1 1.4s-2.1-1-2.1-1.4c0-.5 1.2-1.1 2.1-1.1z"
      />
    </Icon>
  )
}

const PLATFORM_ICONS: Record<Platform, (props: IconProps) => ReactElement> = {
  windows: WindowsIcon,
  macos: MacosIcon,
  linux: LinuxIcon,
}

export function PlatformIcon({ platform, ...props }: IconProps & { platform: Platform }) {
  const Glyph = PLATFORM_ICONS[platform]
  return <Glyph {...props} />
}

export function WaveformIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path {...stroke} strokeWidth="2" d="M4 11v2M8 8v8M12 4.5v15M16 8v8M20 11v2" />
    </Icon>
  )
}

export function BoltIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path fill="currentColor" d="M13.5 2 5 13.2h5.2L9.8 22 19 10.4h-5.4z" />
    </Icon>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path {...stroke} strokeWidth="1.9" d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14" />
    </Icon>
  )
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path {...stroke} d="M12 5v14m0 0 5.5-5.5M12 19l-5.5-5.5" />
    </Icon>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path {...stroke} d="M5 12h14m0 0-5.5-5.5M19 12l-5.5 5.5" />
    </Icon>
  )
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g {...stroke}>
        <path d="M12 3 5 5.8v5.4c0 4.3 2.9 8.1 7 9.3 4.1-1.2 7-5 7-9.3V5.8z" />
        <path d="m9.2 12.1 2 2 3.6-3.9" />
      </g>
    </Icon>
  )
}

export function ChipIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g {...stroke}>
        <rect x="7" y="7" width="10" height="10" rx="2" />
        <path d="M10 3v2m4-2v2m-4 14v2m4-2v2M3 10h2m-2 4h2m14-4h2m-2 4h2" />
      </g>
    </Icon>
  )
}

export function PlugIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g {...stroke}>
        <path d="M9 3v5m6-5v5M6 8h12v2a6 6 0 0 1-6 6 6 6 0 0 1-6-6z" />
        <path d="M12 16v5" />
      </g>
    </Icon>
  )
}

export function MicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g {...stroke}>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </g>
    </Icon>
  )
}

export function CloudOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g {...stroke}>
        <path d="M7.5 18h9.2a3.3 3.3 0 0 0 .6-6.5 5.5 5.5 0 0 0-8.2-4" />
        <path d="M6.6 11.6A3.2 3.2 0 0 0 7.5 18M4 4l16 16" />
      </g>
    </Icon>
  )
}

export function FileTextIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g {...stroke}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6m-6 4h4" />
      </g>
    </Icon>
  )
}

export function QuoteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M9.4 5.5 7.2 12h2.6v6.5H4V11.7L6.6 5.5zm8.4 0L15.6 12h2.6v6.5h-5.8V11.7L15 5.5z"
      />
    </Icon>
  )
}
