import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:file*.mp4',
        headers: [
          { key: 'Content-Type', value: 'video/mp4' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:file*.png',
        headers: [
          { key: 'Content-Type', value: 'image/png' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
      {
        source: '/services',
        destination: '/services.html',
      },
      {
        source: '/projects',
        destination: '/projects.html',
      },
      {
        source: '/about',
        destination: '/about.html',
      },
      {
        source: '/pricing',
        destination: '/pricing.html',
      },
      {
        source: '/contact',
        destination: '/contact.html',
      },
      {
        source: '/labs',
        destination: '/labs.html',
      },
      {
        source: '/api/:path*',
        destination: '/labs/prismautomation/api/:path*',
      },
    ];
  },
};

export default nextConfig;

