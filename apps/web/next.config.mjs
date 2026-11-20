/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'minio.dutai.site',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://localhost:8076'}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/lms',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/lms/:path*',
        destination: '/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
