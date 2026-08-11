import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Download AmaliScribe — private, local-first meeting transcription',
  description:
    'Download AmaliScribe for Windows, macOS and Linux. A self-hosted desktop app that records, transcribes and summarises meetings locally with whisper.cpp, so audio never leaves your machine.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Download AmaliScribe',
    description: 'Private, local-first meeting transcription for Windows, macOS and Linux.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f4f4ef',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
