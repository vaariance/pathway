declare const process: {
  env: {
    NODE_ENV: "development" | "production";
    MESSAGE_TABLE: string;
    API_KEY_TABLE: string;
    ATTESTATION_QUEUE_URL: string;
    RELAY_QUEUE_URL: string;
    RETRY_QUEUE_URL: string;
    APITOOLKIT_API_KEY: string;
    NOBLE_RPC_URL: string;
    DESTINATION_CALLER_API_KEY: string;
    ALCHEMY_API_KEY: string;
    NEXT_PUBLIC_ALCHEMY_API_KEY: string;
    PIMLICO_API_KEY: string;
    PATHWAY_API_KEY: string;
  };
};
