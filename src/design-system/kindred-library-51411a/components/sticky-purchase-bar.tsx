import * as React from "react";
import { Lock } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";

export interface StickyPurchaseBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Formatted price, e.g. "R$ 497". */
  price: string;
  /** Small caption under the price, e.g. "ou 12x de R$ 48,90". */
  caption?: string;
  /** CTA label. */
  ctaLabel?: string;
  onPurchase?: () => void;
}

export const StickyPurchaseBar = React.forwardRef<HTMLDivElement, StickyPurchaseBarProps>(
  (
    { className, price, caption, ctaLabel = "Comprar Agora", onPurchase, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-4 rounded-t-2xl border-t border-outline-variant/40 bg-surface px-4 py-3 shadow-bar",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col">
        <span className="text-price text-on-surface">{price}</span>
        {caption && <span className="text-body-sm text-on-surface-variant">{caption}</span>}
      </div>
      <Button onClick={onPurchase} className="shrink-0">
        <Lock className="size-4" aria-hidden />
        {ctaLabel}
      </Button>
    </div>
  ),
);
StickyPurchaseBar.displayName = "StickyPurchaseBar";
