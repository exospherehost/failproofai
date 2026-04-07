import type { NextConfig } from "next";

const allowedDevOrigins = process.env.FAILPROOFAI_ALLOWED_DEV_ORIGINS
  ? process.env.FAILPROOFAI_ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : undefined;

const nextConfig: NextConfig = {
  ...(allowedDevOrigins ? { allowedDevOrigins } : {}),
  output: "standalone",
  productionBrowserSourceMaps: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.devtool = false;
    return config;
  },
  env: {
    // Expose CLAUDE_PROJECTS_PATH to the client-side if needed
    // Note: Only use this if you need it on the client side
    // For server-side only, you can access it via process.env.CLAUDE_PROJECTS_PATH
  },
};

export default nextConfig;
