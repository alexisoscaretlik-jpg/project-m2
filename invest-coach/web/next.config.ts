import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Cloudflare Workers — wire OpenNext for local `wrangler dev` parity.
// Safe to leave in: it's a no-op on platforms that don't recognise it.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
