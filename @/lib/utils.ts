import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAddress } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validate_address(address: string): string | null {
  if (!address) {
    return null;
  }

  const valid =
    isAddress(address) ||
    address.endsWith(".eth") ||
    (address.startsWith("noble1") && address.length === 44);

  return valid ? null : "invalid address";
}
