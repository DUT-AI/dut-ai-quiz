/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://api:8076'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
