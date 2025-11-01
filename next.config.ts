import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  output: "standalone",
};

export default nextConfig;
