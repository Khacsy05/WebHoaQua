import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/shop/cart/:path*',
        destination: 'http://localhost:8080/shop/cart/:path*',
      },
    ];
  },
};

export default nextConfig;
