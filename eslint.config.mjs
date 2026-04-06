import nextConfig from "eslint-config-next/core-web-vitals";
import tsParser from "@typescript-eslint/parser";

const config = [
  { ignores: ["dist/"] },
  ...nextConfig,
  { settings: { react: { version: "19" } } },
  {
    files: ["**/*.{js,jsx,mjs,mts,cts}"],
    languageOptions: { parser: tsParser },
  },
];

export default config;

