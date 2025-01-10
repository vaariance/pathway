import type { Call, ReceiveMessage } from "thepathway-js";

export type ReceiveMessageFormat = Omit<
  ReceiveMessage,
  "block_confirmation_in_ms"
> & {
  block_confirmation_in_ms: number;
  submitted_at: string;
  partition_key: string;
  tx_hash?: string;
  retry_at?: string;
} & Call[];

export enum AttestationStatus {
  complete = "complete",
  pending_confirmations = "pending_confirmations",
}

export interface AttestationResponse {
  attestation: string | null;
  status: AttestationStatus;
}
