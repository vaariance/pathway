"use client";

import { useEffect } from "react";
import PathwayBackground from "@/components/ui/path";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

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
          <h1 className="mr-5 pr-6 text-5xl font-medium align-top leadinig-[49px] mb-4">
            Uh oh!
          </h1>
          <div className="inline-block max-w-sm space-y-4">
            <h2>
              We hate to see our users encounter errors in our app. We deeply
              apologize for the inconvenience.
            </h2>
            <Button
              variant={"outline"}
              className="text-primary"
              onClick={() => reset()}
            >
              Try again
              <RotateCcw className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
