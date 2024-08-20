import { Connector, useConnect } from "wagmi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import * as rqp from "react-qrcode-pretty";

import { useTheme } from "next-themes";

export function EVMConnector() {
  const { connectors, connect } = useConnect();
  const [wc_uri, set_wc_uri] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const wc = connectors.find(
      (connector: Connector) => connector.name === "WalletConnect"
    );
    wc?.emitter.on("message", (data: { type: string; data?: unknown }) => {
      set_wc_uri(data.data as string);
    });
  }, [connectors, connect]);

  return (
    <>
      {wc_uri ? (
        <div className="bg-background rounded-lg p-4 sm:w-fit flex justify-center mb-4">
          <rqp.QrCode
            value={wc_uri}
            variant={{
              eyes: "gravity",
              body: "dots",
            }}
            color={{
              eyes: theme !== "light" ? "#22C55E" : "#052E16",
              body: theme !== "light" ? "#22C55E" : "#052E16",
            }}
            padding={0}
            margin={0}
            bgColor="#00000000"
            size={320}
            bgRounded
            divider
          />
        </div>
      ) : (
        <ScrollArea className="max-h-[380px] sm:w-72">
          <div className="px-12 py-8 md:p-4 flex flex-col space-y-4">
            {connectors.map((connector: Connector) => (
              <Button
                variant={"ghost"}
                key={connector.uid}
                onClick={() => connect({ connector })}
                className="items-center justify-between"
              >
                {connector.name}
                <Avatar className="h-6 w-6 justify-center rounded-lg">
                  <AvatarImage src={connector.icon} alt={connector.name} />
                  <AvatarFallback>
                    {WalletIcons[connector.name.slice(0, 2).toLowerCase()]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
}

export const WalletIcons: Record<string, React.ReactNode> = {
  in: <Wallet className="h-4 w-4" />,
  co: (
    <svg
      width="1024"
      height="1024"
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1024" height="1024" fill="#0052FF" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M152 512C152 710.823 313.177 872 512 872C710.823 872 872 710.823 872 512C872 313.177 710.823 152 512 152C313.177 152 152 313.177 152 512ZM420 396C406.745 396 396 406.745 396 420V604C396 617.255 406.745 628 420 628H604C617.255 628 628 617.255 628 604V420C628 406.745 617.255 396 604 396H420Z"
        fill="white"
      />
    </svg>
  ),
  wa: (
    <svg
      fill="none"
      height="400"
      viewBox="0 0 400 400"
      width="400"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <clipPath id="a">
        <path d="m0 0h400v400h-400z" />
      </clipPath>
      <g clipPath="url(#a)">
        <circle cx="200" cy="200" fill="#3396ff" r="199.5" stroke="#66b1ff" />
        <path
          d="m122.519 148.965c42.791-41.729 112.171-41.729 154.962 0l5.15 5.022c2.14 2.086 2.14 5.469 0 7.555l-17.617 17.18c-1.07 1.043-2.804 1.043-3.874 0l-7.087-6.911c-29.853-29.111-78.253-29.111-108.106 0l-7.59 7.401c-1.07 1.043-2.804 1.043-3.874 0l-17.617-17.18c-2.14-2.086-2.14-5.469 0-7.555zm191.397 35.529 15.679 15.29c2.14 2.086 2.14 5.469 0 7.555l-70.7 68.944c-2.139 2.087-5.608 2.087-7.748 0l-50.178-48.931c-.535-.522-1.402-.522-1.937 0l-50.178 48.931c-2.139 2.087-5.608 2.087-7.748 0l-70.7015-68.945c-2.1396-2.086-2.1396-5.469 0-7.555l15.6795-15.29c2.1396-2.086 5.6085-2.086 7.7481 0l50.1789 48.932c.535.522 1.402.522 1.937 0l50.177-48.932c2.139-2.087 5.608-2.087 7.748 0l50.179 48.932c.535.522 1.402.522 1.937 0l50.179-48.931c2.139-2.087 5.608-2.087 7.748 0z"
          fill="#fff"
        />
      </g>
    </svg>
  ),
};
