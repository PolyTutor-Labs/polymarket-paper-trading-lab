import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Trace from this repo, not a machine-specific launch directory.
  outputFileTracingRoot: repoRoot,
};

export default nextConfig;
