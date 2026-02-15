import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
      {
        source: "/outputs/:path*",
        destination: "http://localhost:8000/outputs/:path*",
      },
    ];
  },
};

export default nextConfig;
