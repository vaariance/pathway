import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Button } from "@/components/ui/button";
import { Dispatch, FC, Fragment, useState } from "react";
import { Loader2 } from "lucide-react";

export interface WalletModalProps {
  isOpen: boolean;
  setOpen: Dispatch<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletRepo?: any;
}

export type Connector = {
  walletName: string;
  walletInfo: { logo?: unknown };
  connect: (sync?: boolean) => Promise<void>;
};

export const CosmosConnector: FC<
  Partial<WalletModalProps> & { on_click?: () => void }
> = ({ walletRepo: wallet_repo, on_click }) => {
  const [loading, set_loading] = useState<Record<string, boolean>>({});

  const handle_connect = async (connector: Connector) => {
    set_loading((prev) => ({ ...prev, [connector.walletName]: true }));
    try {
      await connector.connect().then(on_click);
    } finally {
      set_loading((prev) => ({ ...prev, [connector.walletName]: false }));
    }
  };
  const get_name = (name: string) => {
    const array = name.split("-");
    return array.includes("mobile") ? array[0] + " mobile" : array[0];
  };
  return (
    <ScrollArea className="max-h-[380px] w-full">
      <div className="px-12 py-8 md:p-4 flex flex-col space-y-4">
        {wallet_repo?.wallets.map((connector: Connector) => (
          <Button
            disabled={loading[connector.walletName]}
            variant={"ghost"}
            key={connector.walletName}
            onClick={() => handle_connect(connector)}
            className="items-center justify-between capitalize"
          >
            {loading[connector.walletName] ? (
              <Fragment>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...
              </Fragment>
            ) : (
              <Fragment>
                {get_name(connector.walletName)}
                <Avatar className="h-6 w-6 justify-center rounded-lg">
                  <AvatarImage
                    src={connector.walletInfo.logo?.toString()}
                    alt={connector.walletName}
                  />
                  <AvatarFallback>
                    {connector.walletName.slice(0, 2).toLowerCase()}
                  </AvatarFallback>
                </Avatar>
              </Fragment>
            )}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};
