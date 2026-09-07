import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";

export interface TopAppBarProps extends React.HTMLAttributes<HTMLElement> {
  /** Ateliê wordmark, set in Playfair Display. */
  title: string;
  /** Minimalist back arrow on the left. */
  onBack?: () => void;
  /** Right-side slot, typically the artisan/user avatar. */
  trailing?: React.ReactNode;
}

export const TopAppBar = React.forwardRef<HTMLElement, TopAppBarProps>(
  ({ className, title, onBack, trailing, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "flex h-14 items-center gap-2 border-b border-outline-variant/40 bg-surface px-2",
        className,
      )}
      {...props}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="inline-flex size-12 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-on-surface/5 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
      )}
      <span
        className={cn(
          "text-headline-sm flex-1",
          !onBack && "pl-2",
        )}
      >
        {title}
      </span>
      {trailing && <div className="pr-2">{trailing}</div>}
    </header>
  ),
);
TopAppBar.displayName = "TopAppBar";
