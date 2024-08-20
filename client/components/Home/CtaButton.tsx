import { ArrowUpRight, CircleArrowOutUpRight } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";

export const CtaButton = () => {
  return (
    <Button asChild variant="default">
      <Link href="https://app.thepathway.to/?mode=noble">
        Go To App
        <ArrowUpRight className="ml-2 h-6 w-6 rounded-full bg-background text-primary p-1" />
      </Link>
    </Button>
  );
};
