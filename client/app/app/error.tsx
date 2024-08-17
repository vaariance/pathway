"use client";

import { useEffect } from "react";
import PathwayBackground from "@/components/ui/path";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="h-screen relative">
      <PathwayBackground />
      <div className="z-30 w-11/12 mx-auto absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-auto pt-0 text-foreground">
        <div>
          <h1 className="mr-5 pr-6 text-2xl font-medium align-top leadinig-[49px]">
            Uh oh!
          </h1>
          <div className="inline-block">
            <h2>
              An error occurred.&nbsp;
              <span>
                <Button variant={"ghost"} onClick={() => reset()}>
                  Try again
                </Button>
              </span>
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}
