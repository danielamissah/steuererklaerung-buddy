import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output bundles everything needed to run the app
  // into .next/standalone — required for Docker multi-stage builds
  output: 'standalone',
};

export default nextConfig;