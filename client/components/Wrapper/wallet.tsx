"use client";

import { ReactElement, useEffect, useState } from "react";
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from "wagmi";
import { EVMConnector as _EVMConnector } from "@/components/Header/evm";
import { useChain, useNameService } from "@cosmos-kit/react-lite";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wallet2 } from "lucide-react";
import { ExoticDialog } from "@/components/ui/exotic-dialog";
import { useExoticBalance } from "@/hooks/use-exotic-balance";
import { Mode } from "thepathway-js";

type WalletWrapperProps = {
  children: (
    address: `0x${string}` | string | undefined,
    connected: boolean,
    disconnect: never,
    name: string | null | undefined | never,
    avatar: string | null | undefined,
    balance: string | undefined,
    Connector: () => JSX.Element
  ) => ReactElement;
};

export const WalletWrapper = ({ children }: WalletWrapperProps) => {
  const searchParams = useSearchParams();

  const get_mode_from_search = (search: string): Mode => {
    const params = new URLSearchParams(search);
    const mode = params.get("mode") as Mode;
    return mode || "noble";
  };

  const mode = get_mode_from_search(searchParams.toString());

  const { address, isWalletConnected, username, connect, disconnect } =
    useChain("noble");

  const { address: eth_address } = useAccount();
  const { disconnect: eth_disconnect } = useDisconnect();
  const { isConnected } = useAccount();
  const { data: ens_name } = useEnsName({ address: eth_address });
  const { data: ens_avatar } = useEnsAvatar({ name: ens_name! });

  const { data: ns } = useNameService();
  const [icns_name, set_icns_name] = useState<string | never>();
  const { balance } = useExoticBalance(mode);

  useEffect(() => {
    const f = async () => {
      try {
        const name = await ns?.resolveName(address!);
        return set_icns_name(name);
      } catch (e) {
        return;
      }
    };
    address && f();
  }, [address, ns, username]);

  const CosmosConnector = () => (
    <Button onClick={() => connect()}>
      <Wallet2 className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );

  const EVMConnector = () => (
    <ExoticDialog>
      <_EVMConnector />
    </ExoticDialog>
  );

  return mode === "noble"
    ? children(
        address,
        isWalletConnected,
        disconnect as unknown as never,
        icns_name,
        undefined,
        balance,
        CosmosConnector
      )
    : children(
        eth_address,
        isConnected,
        eth_disconnect as unknown as never,
        ens_name,
        ens_avatar,
        balance,
        EVMConnector
      );
};
