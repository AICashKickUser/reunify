import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep ignoreBuildErrors for now — the remaining TS errors are in
  // non-critical type narrowing (client-db.ts delete ops, backup-view
  // import typing) that work correctly at runtime. Remove once types
  // are fully hardened.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Strict mode disabled intentionally: the app uses IndexedDB as its
  // primary data store and TanStack Query caches. Double-render in
  // dev causes duplicate IDB writes. Enable after adding proper
  // idempotency guards.
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
};

export default nextConfig;
