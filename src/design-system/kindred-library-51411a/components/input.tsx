import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const inputVariants = cva(
  "min-h-12 w-full rounded-lg border border-outline-variant px-4 text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-1 focus:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      fill: {
        lowest: "bg-surface-container-lowest",
        container: "bg-surface-container",
      },
    },
    defaultVariants: { fill: "lowest" },
  },
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, fill, ...props }, ref) => (
    <input ref={ref} className={cn(inputVariants({ fill }), className)} {...props} />
  ),
);
Input.displayName = "Input";
