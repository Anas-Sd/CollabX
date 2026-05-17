import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker — produces a self-contained Node server
};

export default nextConfig;


