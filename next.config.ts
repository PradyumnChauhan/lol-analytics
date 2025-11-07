import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure environment variables are available at runtime
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
};

export default nextConfig;
