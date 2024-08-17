import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "thepathway",
    name: "Pathway - USDC Bridge",
    short_name: "The Pathway",
    description: "USDC Bridge for Cosmos and EVM chains powered by CCTP",
    scope: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#0C0B09",
    theme_color: "#2FB85D",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-256x256.png",
        sizes: "256x256",
        type: "image/png",
      },
      {
        src: "/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    orientation: "portrait",
  };
}
