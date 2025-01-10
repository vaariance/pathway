declare const process: {
  env: {
    NODE_ENV: "development" | "production";
    MESSAGE_TABLE: string;
    API_KEY_TABLE: string;
    EXECUTION_QUEUE_URL: string;
    ATTESTATION_QUEUE_URL: string;
    RELAY_QUEUE_URL: string;
    RETRY_QUEUE_URL: string;
    APITOOLKIT_API_KEY: string;
    DESTINATION_CALLER_API_KEY: string;
    PIMLICO_API_KEY: string;
    NEXT_PUBLIC_PIMLICO_API_KEY: string;
    THIRDWEB_SECRET: string;
    THIRDWEB_CLIENT_ID: string;
    PATHWAY_API_KEY: string;
    NEXT_PUBLIC_PATHWAY_API_KEY: string;
  };
};

interface BigInt {
  toJSON: () => string;
}
