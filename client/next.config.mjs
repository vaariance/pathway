import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
// Here we use the @cloudflare/next-on-pages next-dev module to allow us to use bindings during local development
// (when running the application with `next dev`), for more information see:
// https://github.com/cloudflare/next-on-pages/blob/main/internal-packages/next-dev/README.md
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty");
    config.plugins.push(new NodePolyfillPlugin());
    return config;
  },
};

export default nextConfig;
