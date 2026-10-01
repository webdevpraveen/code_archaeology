import type { Config } from 'next';

const config: Config = {
  typescript: {
    mode: 'strict',
  },
  eslint: {
    dirs: ['app', 'components', 'lib'],
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'github.com'],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],
};

export default config;
