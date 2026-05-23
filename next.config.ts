import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "fluent-ffmpeg"],
  turbopack: {},
};

export default nextConfig;
