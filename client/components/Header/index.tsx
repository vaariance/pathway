"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useMediaQuery } from "@/hooks/use-media-query";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { WalletWrapper } from "@/components/Wrapper/wallet";
import Image from "next/image";

const Header = () => {
  const is_desktop = useMediaQuery("(min-width: 768px)");
  const { copyToClipboard } = useCopyToClipboard();
  const { theme, setTheme } = useTheme();

  const Internal = ({
    trigger,
    content,
  }: {
    trigger: React.ReactNode;
    content: React.ReactNode;
  }) => {
    if (is_desktop) {
      return (
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
          <HoverCardContent className="rounded-b-xl rounded-t-none backdrop-blur-lg md:w-[240px] w-[180px] -translate-x-6">
            {content}
          </HoverCardContent>
        </HoverCard>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="rounded-b-xl rounded-t-none backdrop-blur-lg md:w-[240px] w-[180px]">
          {content}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="fixed top-0 z-30 w-full max-w-full flex-col">
      <div className="relative flex h-20 justify-center">
        <div className="w-full backdrop-blur-lg bg-background/75 gap-8 flex flex-row items-center justify-between px-4">
          <div className="mr-4 flex shrink-0 items-center relative">
            <Link
              href="/"
              className="flex items-center transition-transform focus:scale-110 focus:outline-0 focus:drop-shadow-primary"
            >
              <Image
                src="/logo.svg"
                alt="pathway logo"
                className="h-16 dark:invert"
                height={64}
                width={120}
                priority
              />
            </Link>
          </div>
          <div className="flex flex-auto items-center justify-end space-x-6">
            <WalletWrapper>
              {(
                address,
                connected,
                disconnect,
                name,
                avatar,
                balance,
                Connector
              ) =>
                connected ? (
                  <Internal
                    trigger={
                      <Button
                        variant="outline"
                        className="hover:rounded-b-none flex md:w-[240px] w-[180px]  py-6 px-4 flex-row items-center justify-between backdrop-blur-lg"
                      >
                        <div>
                          <p className="truncate text-xs font-medium">
                            <span className="group inline-flex items-center gap-2">
                              <span>
                                {name ??
                                  `${address?.slice(0, 6)}...${address?.slice(
                                    -4
                                  )}`}
                              </span>
                            </span>
                          </p>
                          <p className="text-xs font-light">
                            <span className="relative -inset-x-0.5 !h-max rounded p-0.5">
                              {Number(balance ?? "0").toFixed(2)}
                              &nbsp; USDC
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-row items-center">
                          <Avatar>
                            <AvatarImage src={avatar || ""} />
                            <AvatarFallback>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-user size-4"
                              >
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </Button>
                    }
                    content={
                      <>
                        <Button
                          className="cursor-pointer inline-flex items-center justify-start rounded-md p-2 w-full"
                          size={"sm"}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-badge-dollar-sign mr-2 h-4 w-4 text-primary-600"
                          >
                            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
                            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                            <path d="M12 18V6"></path>
                          </svg>
                          Buy with Kado
                        </Button>
                        <Separator className="my-2" />
                        <div className="flex flex-row justify-end space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setTheme(
                                      theme === "light" ? "dark" : "light"
                                    )
                                  }
                                >
                                  <Sun className="h-4 w-4 stroke-zinc-500 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                  <Moon className="absolute  h-4 w-4 stroke-zinc-500 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Toggle theme</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    address && copyToClipboard(address)
                                  }
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-copy h-4 w-4 stroke-zinc-500 group-hover:stroke-white"
                                  >
                                    <rect
                                      width="14"
                                      height="14"
                                      x="8"
                                      y="8"
                                      rx="2"
                                      ry="2"
                                    ></rect>
                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                                  </svg>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy Address</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={disconnect}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-log-out size-4 stroke-zinc-500 group-hover:stroke-white"
                                  >
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" x2="9" y1="12" y2="12"></line>
                                  </svg>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Disconnect</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </>
                    }
                  />
                ) : (
                  <Connector />
                )
              }
            </WalletWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
