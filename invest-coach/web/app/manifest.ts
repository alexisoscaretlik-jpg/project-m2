import type { MetadataRoute } from "next";

// Web App Manifest — turns the site into an installable PWA-ish thing.
// Mainly useful for "Add to Home Screen" on iOS / Android: name + icon
// the user sees on their launcher. Light theme aligned with the brand
// lavender, since that's what the hero uses on dark photos.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Invest Coach",
    short_name: "Invest Coach",
    description:
      "Le coaching d'investissement pour les épargnants français · PEA · AV · PER · IR.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#6747e0",
    orientation: "portrait",
    lang: "fr-FR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
