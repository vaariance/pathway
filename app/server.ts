import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import {
  createRequestHandler,
  ServerBuild,
  AppLoadContext,
} from "@remix-run/cloudflare";
import type { ExecutionContext } from "@cloudflare/workers-types";
// eslint-disable-next-line import/no-unresolved
import manifest from "__STATIC_CONTENT_MANIFEST";

import * as build from "../build/server/index.js";

const asset_manifest = JSON.parse(manifest);

const handler = createRequestHandler(
  build as unknown as ServerBuild,
  process.env.NODE_ENV
);

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const url = new URL(request.url);
      const ttl = url.pathname.startsWith("/build/")
        ? 60 * 60 * 24 * 365 // 1 year
        : 60 * 5; // 5 minutes
      return await getAssetFromKV(
        {
          request,
          waitUntil(promise) {
            return ctx.waitUntil(promise);
          },
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: asset_manifest,
          cacheControl: {
            browserTTL: ttl,
            edgeTTL: ttl,
          },
        }
      );
    } catch (error) {
      /* empty */
    }

    try {
      const loadContext: AppLoadContext = { env };
      return await handler(request, loadContext);
    } catch (error) {
      console.log(error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },
};
