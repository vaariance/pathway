import { useState, useMemo } from "react";
import { StargateClient } from "@cosmjs/stargate";
import { useChain } from "@cosmos-kit/react";
import { useAccount, useBalance, useChainId } from "wagmi";
import { assets } from "chain-registry";
import { AssetsList } from "@/constants/.";

export const useExoticBalance = (mode: string) => {
  const [cosmos_balance, set_cosmos_balance] = useState<bigint>(BigInt(0));
  const { address, getRpcEndpoint, isWalletConnected } = useChain("noble");
  const chain_id = useChainId();
  const { address: eth_address, isConnected } = useAccount();

  const coin = useMemo(() => {
    const chainassets = assets.find((chain) => chain.chain_name === mode);
    return chainassets?.assets.find(
      (asset) => asset.base === AssetsList[mode]?.address
    );
  }, [mode]);

  const evm_balance = useBalance({
    address: eth_address,
    token: AssetsList[chain_id.toString()].address as `0x${string}`,
  });

  useMemo(() => {
    const fetch_cosmos_balance = async () => {
      if (!address || !coin) {
        return;
      }

      let rpc_endpoint = await getRpcEndpoint();
      if (!rpc_endpoint) {
        rpc_endpoint = `https://noble-rpc.polkachu.com/`;
      }

      try {
        const client = await StargateClient.connect(rpc_endpoint);
        const balance = await client.getBalance(address, coin.base);
        const exp = coin.denom_units.find((unit) => unit.denom === coin.display)
          ?.exponent as number;

        const amount = BigInt(balance.amount || 0);
        const divisor = BigInt(10) ** BigInt(exp);
        set_cosmos_balance(amount / divisor);
      } catch (error) {
        console.error("Error fetching Cosmos balance:", error);
        set_cosmos_balance(BigInt(0));
      }
    };

    mode === "noble" && fetch_cosmos_balance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, getRpcEndpoint]);

  return {
    balance:
      mode === "noble"
        ? cosmos_balance.toString()
        : evm_balance.data?.formatted,
    is_loading: mode === "noble" ? false : evm_balance.isLoading,
    refetch: mode === "noble" ? undefined : evm_balance.refetch,
    is_connected: mode === "noble" ? isWalletConnected : isConnected,
  };
};
