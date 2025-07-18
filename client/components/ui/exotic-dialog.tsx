import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { FC, PropsWithChildren, useState } from "react";
import { Wallet2 } from "lucide-react";
import { CosmosConnector, WalletModalProps } from "@/components/Header/cosmos";
import { ExoticDrawer as Drawer } from "@/components/ui/exotic-drawer";

type ExoticDialogProps = FC<
  PropsWithChildren<Partial<WalletModalProps & { theme: unknown }>>
>;

export const ExoticDialog: ExoticDialogProps = ({ children, ...props }) => {
  const [open, set_open] = useState(false);
  const is_desktop = useMediaQuery("(min-width: 768px)");

  const handle_change = (state: boolean) => {
    if (props.setOpen) {
      props.setOpen(state);
    } else {
      set_open(state);
    }
  };

  const is_open = props.isOpen ?? open;

  const trigger = (
    <Button>
      <Wallet2 className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );

  if (is_desktop) {
    return (
      <Dialog open={is_open} onOpenChange={handle_change}>
        {!props.setOpen && <DialogTrigger asChild>{trigger}</DialogTrigger>}

        <DialogContent
          className="border-primary-foreground"
          aria-describedby="connect-wallet-dialog"
        >
          <DialogHeader>
            <DialogTitle>Select Wallet</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer trigger={trigger} is_open={is_open} handle_change={handle_change}>
      {children}
    </Drawer>
  );
};

export const ExoticDialogCosmos = (
  props: Partial<WalletModalProps & { theme: unknown }>
) => {
  return (
    <ExoticDialog {...props}>
      <CosmosConnector
        walletRepo={props.walletRepo}
        on_click={() => props.setOpen && props.setOpen(false)}
      />
    </ExoticDialog>
  );
};
