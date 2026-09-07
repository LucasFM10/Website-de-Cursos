import * as React from "react";
import { cn } from "../lib/utils";

export interface RadioCardProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Payment option title, e.g. "Cartão de crédito". */
  title: string;
  /** Supporting line, e.g. "Em até 12x". */
  description?: string;
  /** Supporting icon, e.g. <CreditCard />. */
  icon?: React.ReactNode;
}

export const RadioCard = React.forwardRef<HTMLInputElement, RadioCardProps>(
  ({ className, title, description, icon, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    return (
      <label
        htmlFor={inputId}
        className={cn(
          "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-colors",
          "has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:outline-2 has-focus-visible:outline-primary",
          className,
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="radio"
          className="size-5 accent-primary"
          {...props}
        />
        {icon && (
          <span className="text-on-surface-variant" aria-hidden>
            {icon}
          </span>
        )}
        <span className="flex flex-col">
          <span className="text-label font-semibold text-on-surface">{title}</span>
          {description && (
            <span className="text-body-sm text-on-surface-variant">{description}</span>
          )}
        </span>
      </label>
    );
  },
);
RadioCard.displayName = "RadioCard";
