import { useAccount } from "wagmi";
import { Chains, PathContructor } from "../constants";
import { useChain } from "@cosmos-kit/react-lite";
import { Pathway, PathwayOptions, Quote, Receiver, Result } from "@/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { parseUnits } from "viem";
import debounce from "lodash.debounce";

export const useDebouncedQuote = (path: PathContructor) => {
  const [quote, set_quote] = useState<Result<Quote, string> | undefined>();

  const { address: eth_address, isConnected } = useAccount();
  const {
    address: noble_address,
    getOfflineSigner,
    isWalletConnected,
  } = useChain("noble");

  const get_pathway_options = useCallback(
    (ignore_viem?: boolean, ignore_cosmos?: boolean) => {
      return new PathwayOptions({
        viem_signer: ignore_viem ? undefined : eth_address,
        noble_signer: ignore_cosmos ? undefined : getOfflineSigner(),
      });
    },
    [eth_address, getOfflineSigner]
  );

  const pathway = useMemo(() => {
    if (!isConnected && !isWalletConnected) return;
    return new Pathway(get_pathway_options(!isConnected, !isWalletConnected));
  }, [get_pathway_options, isConnected, isWalletConnected]);

  const get_quote = useCallback(
    async (sender_address: Receiver) => {
      if (path.error?.["address"]) return;
      if (
        !pathway ||
        !path.to ||
        path.amount === "0" ||
        Number(path.amount) > Number(path.balance) ||
        !path.receiver
      )
        return;

      const quote = await (
        await pathway
      )?.get_quote({
        amount: parseUnits(path.amount, 6),
        from_chain: Chains[path.from],
        to_chain: Chains[path.to.value],
        receiver_address: path.receiver as Receiver,
        sender_address,
      });
      if (!quote?.ok) {
        console.error(quote?.info);
      }
      console.log(quote);
      return quote;
    },
    [
      path.amount,
      path.balance,
      path.error,
      path.from,
      path.receiver,
      path.to,
      pathway,
    ]
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
    debounced_set_quote(sender_address as Receiver);
  }, [debounced_set_quote, eth_address, noble_address, path.inverse]);

  useEffect(() => {
    refresh_quote();
    return () => debounced_set_quote.cancel();
  }, [debounced_set_quote, refresh_quote]);

  return { quote, refresh_quote };
};
