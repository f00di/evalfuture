import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: "/evalfuture",
  assetPrefix: "/evalfuture/",
  images: {
    unoptimized: true
  }
};

export default nextConfig;
