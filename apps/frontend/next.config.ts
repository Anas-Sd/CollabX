import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker
  async redirects() {
    return [
      {
        source: '/register',
        destination: '/login?mode=register',
        permanent: true, // HTTP 308, fixes Google Search Console redirect errors
      },
    ];
  },
};

export default nextConfig;


