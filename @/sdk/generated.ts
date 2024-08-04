import Long from "long";
import _m0 from "protobufjs/minimal";

export interface MsgDepositForBurnWithCaller {
  from: string;
  amount: string;
  destinationDomain: number;
  mintRecipient: Uint8Array;
  burnToken: string;
  destinationCaller: Uint8Array;
}

export interface MsgDepositForBurnWithCallerResponse {
  nonce: Long;
}

export interface MsgReceiveMessage {
  from: string;
  message: Uint8Array;
  attestation: Uint8Array;
}

export interface MsgReceiveMessageResponse {
  success: boolean;
}

function createBaseMsgDepositForBurnWithCaller(): MsgDepositForBurnWithCaller {
  return {
    from: "",
    amount: "",
    destinationDomain: 0,
    mintRecipient: new Uint8Array(0),
    burnToken: "",
    destinationCaller: new Uint8Array(0),
  };
}

export const MsgDepositForBurnWithCaller = {
  encode(
    message: MsgDepositForBurnWithCaller,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.from !== "") {
      writer.uint32(10).string(message.from);
    }
    if (message.amount !== "") {
      writer.uint32(18).string(message.amount);
    }
    if (message.destinationDomain !== 0) {
      writer.uint32(24).uint32(message.destinationDomain);
    }
    if (message.mintRecipient.length !== 0) {
      writer.uint32(34).bytes(message.mintRecipient);
    }
    if (message.burnToken !== "") {
      writer.uint32(42).string(message.burnToken);
    }
    if (message.destinationCaller.length !== 0) {
      writer.uint32(50).bytes(message.destinationCaller);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): MsgDepositForBurnWithCaller {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgDepositForBurnWithCaller();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.from = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.amount = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.destinationDomain = reader.uint32();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.mintRecipient = reader.bytes();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.burnToken = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.destinationCaller = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: Record<string, unknown>): MsgDepositForBurnWithCaller {
    return {
      from: isSet(object.from) ? globalThis.String(object.from) : "",
      amount: isSet(object.amount) ? globalThis.String(object.amount) : "",
      destinationDomain: isSet(object.destinationDomain)
        ? globalThis.Number(object.destinationDomain)
        : 0,
      mintRecipient: isSet(object.mintRecipient)
        ? bytesFromBase64(object.mintRecipient as string)
        : new Uint8Array(0),
      burnToken: isSet(object.burnToken)
        ? globalThis.String(object.burnToken)
        : "",
      destinationCaller: isSet(object.destinationCaller)
        ? bytesFromBase64(object.destinationCaller as string)
        : new Uint8Array(0),
    };
  },

  toJSON(message: MsgDepositForBurnWithCaller): unknown {
    const obj: Record<string, unknown> = {};
    if (message.from !== "") {
      obj.from = message.from;
    }
    if (message.amount !== "") {
      obj.amount = message.amount;
    }
    if (message.destinationDomain !== 0) {
      obj.destinationDomain = Math.round(message.destinationDomain);
    }
    if (message.mintRecipient.length !== 0) {
      obj.mintRecipient = base64FromBytes(message.mintRecipient);
    }
    if (message.burnToken !== "") {
      obj.burnToken = message.burnToken;
    }
    if (message.destinationCaller.length !== 0) {
      obj.destinationCaller = base64FromBytes(message.destinationCaller);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<MsgDepositForBurnWithCaller>, I>>(
    base?: I
  ): MsgDepositForBurnWithCaller {
    return MsgDepositForBurnWithCaller.fromPartial(
      base ?? ({} as Record<string, never>)
    );
  },
  fromPartial<I extends Exact<DeepPartial<MsgDepositForBurnWithCaller>, I>>(
    object: I
  ): MsgDepositForBurnWithCaller {
    const message = createBaseMsgDepositForBurnWithCaller();
    message.from = object.from ?? "";
    message.amount = object.amount ?? "";
    message.destinationDomain = object.destinationDomain ?? 0;
    message.mintRecipient = object.mintRecipient ?? new Uint8Array(0);
    message.burnToken = object.burnToken ?? "";
    message.destinationCaller = object.destinationCaller ?? new Uint8Array(0);
    return message;
  },
};

function createBaseMsgReceiveMessage(): MsgReceiveMessage {
  return {
    from: "",
    message: new Uint8Array(0),
    attestation: new Uint8Array(0),
  };
}

export const MsgReceiveMessage = {
  encode(
    message: MsgReceiveMessage,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.from !== "") {
      writer.uint32(10).string(message.from);
    }
    if (message.message.length !== 0) {
      writer.uint32(18).bytes(message.message);
    }
    if (message.attestation.length !== 0) {
      writer.uint32(26).bytes(message.attestation);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgReceiveMessage {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgReceiveMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.from = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.message = reader.bytes();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.attestation = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: Record<string, unknown>): MsgReceiveMessage {
    return {
      from: isSet(object.from) ? globalThis.String(object.from) : "",
      message: isSet(object.message)
        ? bytesFromBase64(object.message as string)
        : new Uint8Array(0),
      attestation: isSet(object.attestation)
        ? bytesFromBase64(object.attestation as string)
        : new Uint8Array(0),
    };
  },

  toJSON(message: MsgReceiveMessage): unknown {
    const obj: Record<string, unknown> = {};
    if (message.from !== "") {
      obj.from = message.from;
    }
    if (message.message.length !== 0) {
      obj.message = base64FromBytes(message.message);
    }
    if (message.attestation.length !== 0) {
      obj.attestation = base64FromBytes(message.attestation);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<MsgReceiveMessage>, I>>(
    base?: I
  ): MsgReceiveMessage {
    return MsgReceiveMessage.fromPartial(base ?? ({} as Record<string, never>));
  },
  fromPartial<I extends Exact<DeepPartial<MsgReceiveMessage>, I>>(
    object: I
  ): MsgReceiveMessage {
    const message = createBaseMsgReceiveMessage();
    message.from = object.from ?? "";
    message.message = object.message ?? new Uint8Array(0);
    message.attestation = object.attestation ?? new Uint8Array(0);
    return message;
  },
};

function bytesFromBase64(b64: string): Uint8Array {
  if (globalThis.Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (globalThis.Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(globalThis.String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}

type Builtin =
  | Date
  // eslint-disable-next-line @typescript-eslint/ban-types
  | Function
  | Uint8Array
  | string
  | number
  | boolean
  | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Long
  ? string | number | Long
  : T extends globalThis.Array<infer U>
  ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends Record<string, unknown>
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & {
      [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
    };

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long;
  _m0.configure();
}

function isSet(value: unknown): boolean {
  return value !== null && value !== undefined;
}
