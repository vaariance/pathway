/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare/globals" />

interface Env {
  __STATIC_CONTENT: KVNamespace;
  SOME_VARIABLE: string;
}

interface LoadContext {
  env: Env;
}

declare const process: {
  env: {
    NODE_ENV: "development" | "production";
    MESSAGE_TABLE: string;
    API_KEY_TABLE: string;
    RELAY_QUEUE_URL: string;
    RETRY_QUEUE_URL: string;
    APITOOLKIT_API_KEY: string;
    NOBLE_RPC_URL: string;
    DESTINATION_CALLER_API_KEY: string;
    ALCHEMY_API_KEY: string;
    PIMLICO_API_KEY: string;
  };
};

declare module "@remix-run/cloudflare" {
  import type { DataFunctionArgs as RemixDataFunctionArgs } from "@remix-run/cloudflare/dist/index";
  export * from "@remix-run/cloudflare/dist/index";

  export interface DataFunctionArgs
    extends Omit<RemixDataFunctionArgs, "context"> {
    context: LoadContext;
  }
}
