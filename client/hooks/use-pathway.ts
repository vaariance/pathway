import { useAccount } from "wagmi";
import { get_explorer, PathContructor } from "@/constants";
import { useChain } from "@cosmos-kit/react-lite";
import {
  Path,
  Pathway,
  PathwayOptions,
  Quote,
  Receiver,
  Result,
  Chains,
} from "thepathway-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { parseUnits } from "viem";
import debounce from "lodash.debounce";
import { useToast } from "@/hooks/use-toast";
import { ToastActionElement } from "@/components/ui/toast";

type UsePathWayProps = {
  path: PathContructor;
  toast_action?: (text: string, action?: () => void) => ToastActionElement;
};

export const usePathway = ({ path, toast_action }: UsePathWayProps) => {
  const { toast } = useToast();

  const [quote, set_quote] = useState<Result<Quote, string> | undefined>();
  const [is_depositing, set_is_depositing] = useState(false);
  const [error, set_error] = useState<boolean>(false);
  const [success, set_success] = useState<boolean>(false);

  const { address: eth_address, isConnected } = useAccount();
  const {
    address: noble_address,
    getOfflineSignerDirect,
    isWalletConnected,
  } = useChain("noble");

  const pathway = useMemo(() => {
    if (!isConnected && !isWalletConnected) return;
    const opts = new PathwayOptions({
      viem_signer: isConnected ? eth_address : undefined,
      noble_signer: isWalletConnected ? getOfflineSignerDirect() : undefined,
      alchemy_api_key: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    });
    return new Pathway(opts);
  }, [eth_address, getOfflineSignerDirect, isConnected, isWalletConnected]);

  const construct_path = useCallback(
    (sender_address: Receiver): Path | undefined => {
      if (path.error?.["address"]) return;
      if (
        !path.to ||
        path.amount === "0" ||
        Number(path.amount) > Number(path.balance) ||
        !path.receiver
      )
        return;
      return {
        amount: parseUnits(path.amount, 6),
        from_chain: Chains[path.from],
        to_chain: Chains[path.to.value],
        receiver_address: path.receiver as Receiver,
        sender_address,
      };
    },
    [path.amount, path.balance, path.error, path.from, path.receiver, path.to]
  );

  const get_quote = useCallback(
    async (sender_address: Receiver) => {
      const path = construct_path(sender_address);
      if (!path || !pathway) return;

      const q = await pathway?.get_quote(path);
      if (q.error) {
        console.log(q.info);
      }
      return q;
    },
    [construct_path, pathway]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounced_set_quote = useCallback(
    debounce(async (sender_address: Receiver) => {
      get_quote(sender_address).then(set_quote);
    }, 200),
    [get_quote]
  );

  const refresh_quote = useCallback(() => {
    if (!eth_address && !noble_address) return;
    const sender_address =
      path.inverse === "ethereum" ? noble_address : eth_address;
    set_quote(undefined);
    debounced_set_quote(sender_address as Receiver);
  }, [debounced_set_quote, eth_address, noble_address, path.inverse]);

  const deposit = useCallback(
    async (on_success?: () => void) => {
      if (!eth_address && !noble_address) return;
      const sender_address =
        path.inverse === "ethereum" ? noble_address : eth_address;
      const deposit_path = construct_path(sender_address as Receiver);
      if (!path || !pathway) return;
      if (!quote?.ok) {
        toast({
          title: "Uh oh! Gas Quote is unavailable.",
          description:
            "There was a problem calcluating Gas Quote. Please refresh.",
          action: toast_action?.("Refresh", refresh_quote),
          duration: 3500,
        });
        return;
      }
      set_is_depositing(true);
      const res = await pathway?.deposit_for_burn_with_caller(
        deposit_path!,
        process.env.NEXT_PUBLIC_PATHWAY_API_KEY
      );

      if (res?.ok) {
        set_success(true);
        toast({
          title: "Success!",
          description: "You transaction was submitted have successfully!",
          action: toast_action?.("View", () =>
            window.open(
              get_explorer(deposit_path!.from_chain) + "/tx/" + res.value.hash,
              "_blank"
            )
          ),
          duration: 5000,
        });
        setTimeout(() => {
          on_success?.();
          set_success(false);
        }, 3500);
      }
      if (res?.error) {
        set_error(true);
        toast({
          variant: "destructive",
          title: "Uh oh! Transactiona failed.",
          description: `${(res?.info as Error).message}`,
          action: toast_action?.("Retry", deposit),
          duration: 5000,
        });
        setTimeout(() => set_error(false), 3500);
      }

      set_is_depositing(false);
      return res;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [construct_path, eth_address, noble_address, path, pathway, quote]
  );

  useEffect(() => {
    refresh_quote();
    return () => debounced_set_quote.cancel();
  }, [debounced_set_quote, refresh_quote]);

  return {
    quote,
    refresh_quote,
    deposit_for_burn_with_caller: deposit,
    is_depositing,
    deposit_error: error,
    deposit_success: success,
  };
};
