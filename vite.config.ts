import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";

import { installGlobals } from "@remix-run/node";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";

import { visualizer } from "rollup-plugin-visualizer";

installGlobals();

export default defineConfig({
  plugins: [
    remixCloudflareDevProxy(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
    {
      name: "local:exclude-remix-optimizeDeps",
      enforce: "post",
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      config(config, _env) {
        if (config.optimizeDeps?.include) {
          config.optimizeDeps.include = config.optimizeDeps.include.filter(
            (v) => v !== "@remix-run/node"
          );
        }
      },
    },
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  esbuild: {
    platform: "node",
  },
  optimizeDeps: {
    include: ["cosmjs-types", "@cosmos-kit", "wagmi", "viem"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },

  build: {
    rollupOptions: {
      plugins: [
        // @ts-expect-error n/a
        rollupNodePolyFill(),
      ],
      output: {
        manualChunks: (id) => {
          if (id.includes("libsodium-wrappers-sumo")) {
            return "libsodium-wrappers-sumo";
          }
          if (id.includes("cosmjs-types")) {
            return "cosmjs-types";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
