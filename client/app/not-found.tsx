import Link from "next/link";
import PathwayBackground from "@/components/ui/path";

export const runtime = "edge";

export default function NotFound() {
  return (
    <>
      <title>404: This page could not be found.</title>
      <main className="h-screen relative">
        <PathwayBackground />
        <div className="z-30 w-11/12 mx-auto absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-auto pt-0 text-foreground">
          <div>
            <h1 className="mr-5 pr-6 text-2xl font-medium align-top leadinig-[49px]">
              Uh oh!
            </h1>
            <div className="inline-block">
              <h2>
                This page does not exist.&nbsp;
                <span>
                  <Link href="/" className="underline text-blue-500">
                    Go home
                  </Link>
                </span>
              </h2>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
