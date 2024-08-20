import Link from "next/link";
import PathwayBackground from "@/components/ui/path";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export const runtime = "edge";

export default function NotFound() {
  return (
    <>
      <title>404: Not Found.</title>
      <main className="h-screen relative">
        <PathwayBackground />
        <div className="z-30 w-11/12 mx-auto absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-auto pt-0 text-foreground">
          <div>
            <h1 className="mr-5 pr-6 text-5xl font-medium align-top leadinig-[49px] mb-4">
              Uh oh!
            </h1>
            <div className="inline-block max-w-sm space-y-4">
              <h2 className="text-foreground">
                With deep regrets, we wish to inform you that the page you are
                searching for is beyond our knowledge.
              </h2>
              <Button asChild variant={"outline"}>
                <Link href="/" className="text-primary">
                  Go back to homepage
                  <ExternalLink className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
