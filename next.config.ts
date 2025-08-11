import type { NextConfig } from 'next';
import type { RouteMatchCallbackOptions } from 'workbox-core';

const runtimeCaching = [
  // 1. Never cache Next.js build files (JS/CSS)
  {
    urlPattern: ({ url }: RouteMatchCallbackOptions) =>
      url.pathname.startsWith('/_next/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css'),
    handler: 'NetworkOnly',
  },

  // 2. Never cache HTML page navigations
  {
    urlPattern: ({ request }: RouteMatchCallbackOptions) =>
      request.mode === 'navigate',
    handler: 'NetworkOnly',
  },

  // 3. Cache images
  {
    urlPattern: ({ url }: RouteMatchCallbackOptions) =>
      url.pathname.startsWith('/_next/image') ||
      /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/.test(url.pathname),
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'images-cache',
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: 24 * 60 * 60,
      },
    },
  },

  // 4. Cache API GET requests
  {
    urlPattern: ({ url, request }: RouteMatchCallbackOptions) =>
      request.method === 'GET' && url.pathname.startsWith('/api/'),
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      networkTimeoutSeconds: 5,
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 5 * 60,
      },
    },
  },
];

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
  buildExcludes: [
    /middleware-manifest\.json$/,
    /_next\/static\/.*\.js$/,
  ],
});

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value:
              'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
