import * as React from "react";
import { cn } from "../lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {}

export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ className, ...props }, ref) => (
    <hr
      ref={ref}
      className={cn("border-0 border-t border-outline-variant", className)}
      {...props}
    />
  ),
);
Divider.displayName = "Divider";
