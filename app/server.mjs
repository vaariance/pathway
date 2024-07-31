import { createRequestHandler } from "@remix-run/server-runtime";
import * as remixBuild from "../build/server/index.js";

// eslint-disable-next-line no-undef
const remixHandler = createRequestHandler(remixBuild, process.env.NODE_ENV);

export default {
  // eslint-disable-next-line no-unused-vars
  fetch(request, env, _ctx) {
    // eslint-disable-next-line no-undef
    Object.assign(globalThis, { env });
    return remixHandler(request);
  },
};
