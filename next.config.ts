import type { NextConfig } from "next";
// Static import (instead of `readFileSync(join(__dirname, "package.json"))`)
// keeps Turbopack's Node File Tracer from flagging this file as doing
// dynamic filesystem work, which produced an "Encountered unexpected file
// in NFT list" warning during `bun run build`.
import pkg from "./package.json";

const allowedDevOrigins = process.env.FAILPROOFAI_ALLOWED_DEV_ORIGINS
  ? process.env.FAILPROOFAI_ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : undefined;

const nextConfig: NextConfig = {
  ...(allowedDevOrigins ? { allowedDevOrigins } : {}),
  output: "standalone",
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@img/**",
      "node_modules/sharp/**",
    ],
  },
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
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
};

export default nextConfig;
