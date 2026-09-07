import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg text-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary hover:bg-primary-container active:bg-primary-container",
        outline:
          "border border-primary bg-transparent text-primary hover:bg-primary/5 active:bg-primary/10",
        "outline-neutral":
          "border border-outline bg-transparent text-on-surface hover:bg-on-surface/5",
        ghost: "bg-transparent text-primary hover:bg-primary/5",
      },
      size: {
        md: "px-6 py-3",
        sm: "min-h-10 px-4 py-2 text-body-sm font-medium",
        pill: "rounded-full px-7 py-3",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export { buttonVariants };
