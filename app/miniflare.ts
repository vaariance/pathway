import { getPlatformProxy } from "wrangler";

const { env } = await getPlatformProxy();
Object.assign(globalThis, { env });
