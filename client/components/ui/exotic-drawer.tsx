import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { FC, PropsWithChildren } from "react";
import { WalletModalProps } from "@/components/Header/cosmos";

type ExoticDrawerProps = FC<
  PropsWithChildren<
    Partial<WalletModalProps & { theme: unknown }> & {
      trigger: JSX.Element;
      is_open: boolean;
      handle_change: (state: boolean) => void;
    }
  >
>;

export const ExoticDrawer: ExoticDrawerProps = ({
  children,
  trigger,
  is_open,
  handle_change,
  ...props
}) => {
  return (
    <Drawer open={is_open} onOpenChange={handle_change}>
      {!props.setOpen && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent
        className="rounded-t-3xl border-primary-foreground"
        aria-describedby="connect-wallet-drawer"
      >
        <DrawerHeader className="text-left">
          <DrawerTitle>Select Wallet</DrawerTitle>
        </DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
};
