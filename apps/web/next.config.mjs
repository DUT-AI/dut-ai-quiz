/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/lms',
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
        source: '/',
        destination: '/lms/dashboard',
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
