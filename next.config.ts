import type { NextConfig } from 'next'

// Nothing to special-case: the libSQL client is pure JavaScript over HTTP, so
// there are no native modules to keep out of the bundle.
const nextConfig: NextConfig = {}

export default nextConfig
