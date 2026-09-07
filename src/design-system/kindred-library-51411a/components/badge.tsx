import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-overline",
  {
    variants: {
      variant: {
        /* Floating course-level tag (BÁSICO / AVANÇADO): semi-translucent off-white */
        level: "bg-surface/90 text-on-surface backdrop-blur-sm",
        leather: "bg-accent-leather/10 text-accent-leather",
        success: "bg-success/10 text-success",
        neutral: "bg-surface-container text-on-surface-variant",
      },
    },
    defaultVariants: { variant: "level" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  ),
);
Badge.displayName = "Badge";
