/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Keep compiled pages in memory longer in dev (default: 15s → 1 hour)
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },

  // Optimize for faster builds
  swcMinify: true,

  // Reduce build time by skipping type checking (run separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during builds (run separately)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimize images
  images: {
    unoptimized: true,
  },

  // Prevent mongodb (and other Node.js-only packages) from being bundled
  // into edge/client bundles where 'crypto' and other builtins don't exist.
  // serverExternalPackages moved into experimental below for Next.js 14 compat.

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side: stub out Node.js built-ins that mongodb references
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        os: false,
        path: false,
        stream: false,
        zlib: false,
        http: false,
        https: false,
        child_process: false,
      }
    }
    return config
  },

  // Enable experimental features for faster dev
  experimental: {
    // Enable instrumentation.ts startup hook
    instrumentationHook: true,
    // Keep mongodb and related Node.js-only packages out of edge bundles
    serverComponentsExternalPackages: ['mongodb', 'livekit-server-sdk', 'socks'],
    // Optimize package imports for faster builds
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      'recharts',
      'date-fns',
    ],
  },
}

module.exports = nextConfig
