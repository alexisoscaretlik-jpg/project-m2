import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// OpenNext config for Cloudflare Workers deployment.
// Defaults are fine for our app — no incremental cache, no R2,
// no advanced features. We can layer those later if traffic warrants.
export default defineCloudflareConfig({});
