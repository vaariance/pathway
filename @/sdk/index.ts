import { WalletClient as ViemWalletClient } from "viem";
import { WalletClient as CosmoskitWalletClient } from "@cosmos-kit/core";
import { SigningStargateClient } from "@cosmjs/stargate";
//import { GeneratedType } from "@cosmjs/proto-signing";

export type SerializableResult<T, E> =
  | {
      ok: false;
      value?: undefined;
      error: E;
    }
  | {
      ok: true;
      value: T;
      error?: undefined;
    };

export type Result<T, E = string> = SerializableResult<T, E> & {
  unwrap(): T;
  unwrap_err(): E;
  unwrap_or(default_value: T): T;
  map_err<F>(f: (e: E) => F): Result<T, F>;
  map<U>(f: (v: T) => U): Result<U, E>;
};

export const Result = <T, E>(res: SerializableResult<T, E>): Result<T, E> =>
  res.ok ? Ok(res.value) : Err(res.error);

export const Err = <E>(error: E): Result<never, E> => ({
  ok: false,
  error,
  unwrap: () => {
    throw error;
  },
  unwrap_err: () => error,
  unwrap_or: <T>(default_value: T): T => default_value,
  map_err: <F>(f: (e: E) => F): Result<never, F> => Err(f(error)),
  map: (): Result<never, E> => Err(error),
});

export const Ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value,
  unwrap: () => value,
  unwrap_err: () => {
    throw new Error(`Not an error. Has value: ${value}`);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unwrap_or: <F>(_: F): T => value,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  map_err: <F>(_: (e: never) => F): Result<T, F> => Ok(value),
  map: <U>(f: (v: T) => U): Result<U, never> => Ok(f(value)),
});

export enum Chain {
  Noble = "noble",
  Ethereum = "ethereum",
  Arbitrum = "arbitrum",
  Base = "base",
}

export type Receiver = `0x${string}` | `noble1${string}` | `${string}.eth`;

export type Path = {
  from_chain: Chain;
  to_chain: Chain;
  receiver_address: Receiver;
  amount: bigint;
};

export type PathwayClient =
  | ViemWalletClient
  | CosmoskitWalletClient
  | SigningStargateClient;

export type Quote = {
  estimated_fee: bigint;
  estimated_time_in_milliseconds: number;
  estimated_output_amount: bigint;
};

export type TransferResponse = Result<{
  actual_cost: bigint;
  actual_amount: bigint;
}>;

// export const cctpTypes: ReadonlyArray<[string, GeneratedType]> = [
//     ["/circle.cctp.v1.MsgDepositForBurnWithCaller", MsgDepositForBurnWithCaller],
// ];

// export interface MsgDepositForBurnWithCaller {
//   from: string;
//   amount: string;
//   destinationDomain: number;
//   mintRecipient: Uint8Array;
//   burnToken: string;
//   destinationCaller: Uint8Array;
// }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Pathway {
  client: PathwayClient;
  constructor(options: { client: PathwayClient }) {
    this.client = options.client;
  }

  private async validate_path(path: Path) {
    const { from_chain, to_chain, receiver_address, amount } = path;
    if (receiver_address.startsWith("noble1") && to_chain !== Chain.Noble) {
      throw new Error("Receiver must be Noble address");
    }

    if (receiver_address.endsWith(".eth") && from_chain !== Chain.Noble) {
      throw new Error("Receiver must be ENS name");
    }

    if (receiver_address.startsWith("0x") && from_chain !== Chain.Noble) {
      throw new Error("Receiver must be EVM address");
    }

    if (amount === BigInt(0)) {
      throw new Error("Amount is required and must be greater than 0");
    }

    if (from_chain === to_chain) {
      throw new Error("To and from Chains cannot be the same");
    }
  }

  // async get_quote(path: Partial<Path>): Promise<Quote> {
  //   return {};
  // }
}
