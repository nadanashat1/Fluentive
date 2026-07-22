/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/avatars/**',
      },
    ],
  },
  output: 'standalone',
  
  // Turbopack configuration (Next.js 16+)
  turbopack: {},
  
  // Compression
  compress: true,
  
  // Powered by header removal for security
  poweredByHeader: false,
  
  env: {
    NEXT_PUBLIC_COOKIE_SECURE: process.env.NODE_ENV === 'production' ? 'true' : 'false',
    NEXT_PUBLIC_COOKIE_SAME_SITE: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
  // Fix workspace structure issue
  ...(process.env.NODE_ENV === 'production' ? {} : {
    webpack: (config) => {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': './src',
      };
      return config;
    },
  }),
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },
  serverExternalPackages: ['@prisma/client'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss: http://localhost:* ws://localhost:* ws://127.0.0.1:* http://127.0.0.1:*; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
