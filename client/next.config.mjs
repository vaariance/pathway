import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import withPWAInit from "@ducanh2912/next-pwa";

// Here we use the @cloudflare/next-on-pages next-dev module to allow us to use bindings during local development
// (when running the application with `next dev`), for more information see:
// https://github.com/cloudflare/next-on-pages/blob/main/internal-packages/next-dev/README.md
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty");
    config.plugins.push(new NodePolyfillPlugin());
    return config;
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/app/",
          has: [
            {
              type: "header",
              key: "x-pathway-app",
            },
          ],
        },
      ],
      fallback: [
        {
          source: "/:path*",
          destination: "/app/:path*",
          has: [
            {
              type: "header",
              key: "x-pathway-app",
            },
          ],
        },
      ],
    };
  },
};

export default withPWA(nextConfig);
