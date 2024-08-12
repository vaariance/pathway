import type { ReceiveMessage } from "@pathway/sdk";
import { base, mainnet, arbitrum } from "@alchemy/aa-core";

export type ReceiveMessageFormat = Required<
  Omit<ReceiveMessage, "circle_attestation">
> & {
  circle_attestation?: `0x${string}`;
  submitted_at: string;
  tx_hash: string;
  retry_at?: string;
};

export enum AttestationStatus {
  complete = "complete",
  pending_confirmations = "pending_confirmations",
}

export interface AttestationResponse {
  attestation: string | null;
  status: AttestationStatus;
}

export const ALCHEMY_CHAINS = {
  ethereum: mainnet,
  arbitrum,
  base,
  noble: undefined,
};
