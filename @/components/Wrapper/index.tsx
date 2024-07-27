import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "@remix-run/react";
import { useSwitchChain } from "wagmi";

import { useExoticBalance } from "@/hooks/use-exotic-balance";
import { ChainMetadata, chain_data, Mode, PathContructor } from "@/constants/.";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type WrapperProps<T> = {
  children: (
    is_connected: boolean,
    set_error: Dispatch<Record<string, unknown> | null>,
    set_amount: Dispatch<SetStateAction<string>>,
    set_address: Dispatch<SetStateAction<string>>,
    path: PathContructor,
    on_accept: () => void,
    accepted: boolean,
    change_route: (next: string) => void,
    change_chain: (new_chain: string) => void
  ) => ReactElement;
};

export const Wrapper = <T extends Element>({ children }: WrapperProps<T>) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { chains, switchChain } = useSwitchChain();

  const [error, set_error] = useState<Record<string, unknown> | null>(null);
  const [chain, set_chain] = useState<ChainMetadata | null>(null);
  const [amount, set_amount] = useState<string>("0");
  const [address, set_address] = useState<string>("");
  const [accepted, set_accepted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("noble-path-tcs-accepted") === "true";
    }
    return false;
  });

  const _set_error = (error: Record<string, unknown> | null) => {
    error && set_error((prev) => ({ ...prev, ...error }));
  };

  const get_mode_from_search = (search: string): Mode => {
    const params = new URLSearchParams(search);
    const mode = params.get("mode") as Mode;
    return mode || "noble";
  };

  const mode = get_mode_from_search(location.search);

  const { balance, is_connected } = useExoticBalance(mode);

  const on_accept = () => {
    set_accepted(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("noble-path-tcs-accepted", "true");
    }
  };

  const change_route = (next: string) => {
    const chain = chains.find((c) => c.name.toLowerCase().includes(next));
    if (chain) switchChain({ chainId: chain.id });
    navigate(`/?mode=${next}`);
  };

  const change_chain = (new_chain: string) =>
    set_chain(chain_data.find((chain) => chain.value === new_chain)!);

  // const walk = () => {
  //   const validationError = validateAddress(address);
  //   if (validationError) {
  //     setError(validationError);
  //   } else {
  //     onValidAddress(address);
  //   }
  // };

  const path: PathContructor = useMemo(() => {
    const from = mode;
    const inverse = mode === "noble" ? "ethereum" : "noble";

    const to = () => {
      switch (chain?.value) {
        case undefined: {
          const exp = chain_data.find((c) => c.type === inverse)!;
          return exp;
        }
        case "noble":
          if (mode === "noble") {
            const exp = chain_data.find((c) => c.type === inverse)!;
            return exp;
          }
          return chain;

        default:
          if (mode !== "noble" && chain?.type === "ethereum") {
            const exp = chain_data.find((c) => c.type === inverse)!;
            return exp;
          }
          return chain;
      }
    };
    return {
      from,
      to: to(),
      inverse,
      amount,
      balance: balance ?? "0",
      receiver: address,
      error,
    };
  }, [mode, amount, balance, address, error, chain]);

  return children(
    is_connected,
    _set_error,
    set_amount,
    set_address,
    path,
    on_accept,
    accepted,
    change_route,
    change_chain
  );
};
