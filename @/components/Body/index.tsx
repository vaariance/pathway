import { Label } from "@/components/ui/label";
import { Footprints, Minus, Plus, Terminal } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExoticInput, Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, validate_address } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ExoticSelectTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Wrapper } from "../Wrapper";
import {
  ChangeEvent,
  Dispatch,
  Fragment,
  SetStateAction,
  useCallback,
} from "react";
import debounce from "lodash.debounce";
import { chain_data, PathContructor } from "@/constants/.";
import { motion, AnimatePresence } from "framer-motion";
import { formatUnits } from "viem";
import { Quote } from "@/sdk";
import { svg_assets } from "../ui/assets";

type BodyProps = React.ComponentProps<typeof Card>;

export function Body({ className, ...props }: BodyProps) {
  const render_quote = (quote: Quote): string => {
    const execution_cost = quote.estimated_fee["execution_cost"]!;
    const routing_fee = quote.estimated_fee["routing_fee"]!;

    const exec_fee = formatUnits(
      execution_cost.amount + routing_fee.amount,
      execution_cost.decimals
    );

    return "$" + Number(exec_fee).toFixed(4);
  };
  return (
    <Wrapper<HTMLDivElement>>
      {(
        is_connected,
        set_error,
        set_amount,
        set_address,
        path,
        on_accept,
        accepted,
        change_route,
        change_chain,
        quote
      ) => (
        <Card
          className={cn(
            "w-full md:w-11/12 max-w-md mx-auto absolute md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 h-full md:h-auto pt-24 md:pt-0",
            className
          )}
          {...props}
        >
          <CardHeader>
            <CardTitle>The Path</CardTitle>
            <CardDescription>
              Walk your USDC from
              <span className="capitalize">&nbsp;{path.from}</span> to
              <span className="capitalize">&nbsp;{path?.to?.value}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-md border p-4 space-y-4">
              <div className=" flex items-center space-x-4 mb-4">
                <>{svg_assets.usdc("aspect-square w-10 h-10")}</>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">USDC</p>
                </div>
                <ChainSelection handle_change={change_route} path={path} />
              </div>
              <Label htmlFor="amount" className="text-muted-foreground">
                Enter an Amount:
              </Label>
              <div className="flex items-center justify-center space-x-2 pb-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full"
                  onClick={() =>
                    set_amount(Math.max(0, Number(path.amount) - 1).toString())
                  }
                  disabled={Number(path.amount) <= 0}
                >
                  <Minus className="h-4 w-4" />
                  <span className="sr-only">Decrease</span>
                </Button>
                <div className="flex-1 text-center">
                  <ExoticInput
                    id="amount"
                    type="text"
                    value={path.amount}
                    className={cn(
                      Number(path.amount) > Number(path.balance) &&
                        "text-red-500"
                    )}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        set_amount(value);
                      }
                    }}
                  />
                  <div className="text-[0.70rem] uppercase text-muted-foreground">
                    USDC
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full"
                  onClick={() =>
                    set_amount((Number(path.amount) + 1).toString())
                  }
                  disabled={Number(path.amount) > Number(path.balance)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Increase</span>
                </Button>
              </div>
              <Label htmlFor="address" className="text-muted-foreground">
                Enter an Address:
              </Label>
              <AddressSelection
                {...{ path, set_error, set_address, change_chain }}
              />
            </div>
            <ul className="grid gap-3 text-sm text-muted-foreground">
              <li className="flex items-center justify-between">
                <span>You will receive:</span>
                {quote?.ok ? (
                  <span className="italic">
                    {"$"}
                    {Number(
                      formatUnits(quote.unwrap().estimated_output_amount, 6)
                    ).toFixed(2)}
                  </span>
                ) : (
                  <span>
                    <Skeleton className="w-[100px] h-[20px] rounded-full" />
                  </span>
                )}
              </li>
              <li className="flex items-center justify-between">
                <span>Estimated fee:</span>
                {quote?.ok ? (
                  <span className="italic">{render_quote(quote.unwrap())}</span>
                ) : (
                  <span>
                    <Skeleton className="w-[100px] h-[20px] rounded-full" />
                  </span>
                )}
              </li>
              <li className="flex items-center justify-between">
                <span>Ariving in:</span>
                {quote?.ok ? (
                  <span className="italic">
                    {quote.unwrap().estimated_time_in_milliseconds / 1000 < 60
                      ? Math.round(
                          quote.unwrap().estimated_time_in_milliseconds / 1000
                        ) + " sec"
                      : Math.floor(
                          quote.unwrap().estimated_time_in_milliseconds / 60000
                        ) + " mins"}
                  </span>
                ) : (
                  <span>
                    <Skeleton className="w-[100px] h-[20px] rounded-full" />
                  </span>
                )}
              </li>
            </ul>
            <TermsOfService accepted={accepted} on_accept={on_accept} />
          </CardContent>
          <CardFooter>
            <div className="flex-1 space-y-4 justify-center">
              <Button
                disabled={
                  !accepted ||
                  !is_connected ||
                  !path.receiver ||
                  Number(path.amount) <= 0
                }
                className="w-full"
                onClick={() => {}}
              >
                <Footprints className="mr-2 h-4 w-4" />{" "}
                {!is_connected
                  ? "Wallet Not Connected"
                  : !path.receiver
                  ? "Recipient Empty"
                  : Number(path.amount) <= 0
                  ? "Amount too Small"
                  : "Walk"}
              </Button>
              <Separator />
              <p className="text-xs text-muted-foreground text-center">
                powered by CCTP
              </p>
            </div>
          </CardFooter>
        </Card>
      )}
    </Wrapper>
  );
}

const ChainItem = ({ chain }: { chain: (typeof chain_data)[number] }) => (
  <span className="inline-flex items-center gap-2">
    <>{chain.img_src("aspect-square justify-center h-6 w-6")}</>
    {chain.name}
  </span>
);

const ChainSelection = ({
  handle_change,
  path,
  minified = false,
}: {
  handle_change: (next: string) => void;
  path: PathContructor;
  minified?: boolean;
}) => {
  const trigger_content = minified ? (
    <ExoticSelectTrigger
      className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
    >
      <>{path?.to?.img_src("aspect-square justify-center h-6 w-6")}</>
    </ExoticSelectTrigger>
  ) : (
    <SelectTrigger className={minified ? "w-auto" : "w-[180px]"}>
      <SelectValue />
    </SelectTrigger>
  );

  return (
    <Select
      value={minified ? path?.to?.value : path.from}
      onValueChange={handle_change}
    >
      {trigger_content}
      <SelectContent>
        {chain_data
          .filter((chain) => (minified ? chain.type === path.inverse : true))
          .map((chain) => (
            <SelectItem key={chain.value} value={chain.value}>
              <ChainItem chain={chain} />
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};

const TermsOfService = ({
  accepted,
  on_accept,
}: {
  accepted: boolean;
  on_accept: () => void;
}) => {
  return (
    <Sheet>
      <AnimatePresence>
        {!accepted && (
          <SheetTrigger
            className={cn("transition-all ease-in-out duration-1000")}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <Alert className="text-start">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                  To proceed, you have to click me and accept our terms of
                  service.
                </AlertDescription>
              </Alert>
            </motion.div>
          </SheetTrigger>
        )}
      </AnimatePresence>
      <SheetContent className="w-full md:w-auto">
        <SheetHeader>
          <SheetTitle>Terms of Service</SheetTitle>
          <SheetDescription>
            Pathway is a platform designed to facilitate the bridging of USDC
            between Noble and Ethereum. By using Pathway, you agree to be bound
            by these terms. Please read them carefully.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-4/6 md:h-5/6 w-full rounded-md p-4 text-muted-foreground flex-auto text-sm">
          <div>
            <h3 className="my-2 font-semibold">Acceptance of Terms</h3>
            <p>
              By using Pathway, you acknowledge that you have read, understood,
              and agree to be bound by these Terms. If you are using our
              services on behalf of an organization, you represent and warrant
              that you have the authority to bind that organization to these
              Terms.
            </p>
          </div>
          <div>
            <h3 className="my-2 font-semibold">Services Provided</h3>
            <p>
              Pathway offers a service that allows users to transfer USDC
              between the Noble blockchain and the Ethereum blockchain. This
              includes the management of transactions and the provision of
              support related to these services.
            </p>
          </div>
          <div>
            <h3 className="my-2 font-semibold">Fees</h3>
            <p>
              Users agree to a flat-rate between 0.06 and 0.81 usd calculated
              from a linearly interpolating slope applied to gas fees on all
              transactions conducted through the Pathway platform (free for
              noble). This fee is automatically deducted from each transaction.
              Pathway reserves the right to modify the fee structure with prior
              notice to users.
            </p>
          </div>
          <div>
            <h3 className="my-2 font-semibold">User Responsibilities</h3>
            <p>
              Users are responsible for ensuring the legality and accuracy of
              their transactions. This includes verifying wallet addresses and
              transaction amounts, and ensuring compliance with all applicable
              laws. Pathway is not liable for any losses resulting from user
              errors or illegal activities.
            </p>
          </div>
          <div>
            <h3 className="my-2 font-semibold">Disclaimer of Warranties</h3>
            <p>
              Pathway provides its services on an &quot;as is&quot; and &quot;as
              available&quot; basis without any warranties, either express or
              implied. We do not warrant that our services will be
              uninterrupted, error-free, or completely secure. Your use of our
              services is at your own risk.
            </p>
          </div>
          <div>
            <h3 className="my-2 font-semibold">Limitation of Liability</h3>
            <p className="inline-flex flex-col gap-2">
              To the maximum extent permitted by law, Pathway shall not be
              liable for any direct, indirect, incidental, special,
              consequential, or punitive damages, including but not limited to
              loss of profits, data, use, goodwill, or other intangible losses,
              resulting from:
              <span>
                - Your access to or use of, or inability to access or use, our
                services.
              </span>
              <span>
                - Any conduct or content of any third party on our services.
              </span>
              <span>
                - Any unauthorized access, use, or alteration of your
                transmissions or content.
              </span>
            </p>
          </div>
          <div>
            <h3 className="my-2 font-semibold">Indemnification</h3>
            <p>
              You agree to indemnify, defend, and hold harmless Pathway, its
              affiliates, officers, directors, employees, and agents from and
              against any claims, liabilities, damages, losses, and expenses,
              including without limitation, reasonable legal and accounting
              fees, arising out of or in any way connected with your access to
              or use of our services, your violation of these Terms, or your
              infringement of any third party rights.
            </p>
          </div>
          <div>
            <h3 className="my-2 font-semibold">Changes to the Terms</h3>
            <p>
              Pathway reserves the right to modify these Terms at any time. We
              will provide notice of such changes by posting the revised Terms
              on our website. Your continued use of our services following the
              posting of changes constitutes your acceptance of such changes. By
              using Pathway, you acknowledge that you have read, understood, and
              agree to these Terms of Service.
            </p>
          </div>
        </ScrollArea>
        <SheetFooter>
          <SheetClose asChild>
            <div className="flex items-center space-x-2 my-4">
              <Checkbox
                id="terms"
                checked={accepted}
                onCheckedChange={(checked) => {
                  if (checked) {
                    on_accept();
                  }
                }}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Accept terms and conditions
              </label>
            </div>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

function AddressSelection({
  path,
  set_error,
  set_address,
  change_chain,
}: {
  path: PathContructor;
  set_error: Dispatch<Record<string, unknown> | null>;
  set_address: Dispatch<SetStateAction<string>>;
  change_chain: Dispatch<string>;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounced_validation = useCallback(
    debounce((value) => {
      set_error({ address: validate_address(value, path.inverse) });
    }, 300),
    [set_error]
  );

  const on_address_change = useCallback(
    (value: string) => {
      set_address(value);
    },
    [set_address]
  );

  const handle_change = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    on_address_change(value);
    debounced_validation(value);
  };

  const handle_blur = () => {
    set_error({ address: validate_address(path.receiver, path.inverse) });
  };

  return (
    <Fragment>
      <div className="flex items-center space-x-2">
        <Input
          id="address"
          type="text"
          name="address"
          className="flex-grow"
          placeholder={`${path?.to?.value} address${
            path?.to?.type === "ethereum" ? " or ens" : ""
          }`}
          value={path.receiver}
          onChange={handle_change}
          onBlur={handle_blur}
        />
        <ChainSelection
          handle_change={change_chain}
          path={path}
          minified={true}
        />
      </div>
      <p className="text-destructive py-1 text-start text-sm">
        {path.error?.["address"] as string | null}
      </p>
    </Fragment>
  );
}
