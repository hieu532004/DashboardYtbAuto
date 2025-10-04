/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Trên Vercel (Preview/Prod), bắt mọi /api/* đi qua proxy server-side
    if (process.env.VERCEL === '1') {
      return [{ source: '/api/:path*', destination: '/api-proxy/api/:path*' }];
    }
    return [];
  },
};

module.exports = nextConfig;
