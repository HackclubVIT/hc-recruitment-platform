import type { NextConfig } from "next";

const isExport = process.env.OUTPUT_EXPORT === 'true' || process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: isExport ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  ...(!isExport && {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: process.env.API_URL || 'http://127.0.0.1:5000/api/:path*',
        },
      ];
    },
  }),
};

export default nextConfig;

