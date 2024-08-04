import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAddress } from "viem";
import { Mode } from "../constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validate_address(address: string, mode: Mode): string | null {
  if (!address) {
    return null;
  }

  switch (mode) {
    case "noble": {
      const valid = address.startsWith("noble1") && address.length === 44;
      return valid ? null : "invalid noble address";
    }
    default: {
      const valid = isAddress(address) || address.endsWith(".eth");
      return valid ? null : `invalid ${mode} address`;
    }
  }
}
