import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone build (its own minimal
  // node_modules) so the Azure App Service deploy package doesn't need
  // the full node_modules tree copied alongside it.
  output: "standalone",
};

export default nextConfig;
