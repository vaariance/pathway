import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          className,
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const ExoticInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          className,
          "rounded-md bg-transparent focus-visible:outline-none border-none disabled:cursor-not-allowed disabled:opacity-50 text-5xl font-bold tracking-tighter w-full text-center"
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

ExoticInput.displayName = "Input";
Input.displayName = "Input";

export { Input, ExoticInput };
