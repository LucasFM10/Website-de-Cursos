import * as React from "react";
import { cn } from "../lib/utils";

export interface BottomNavItem {
  /** Destination label, e.g. "Início". */
  label: string;
  /** Lucide icon element. */
  icon: React.ReactNode;
}

export interface BottomNavProps extends React.HTMLAttributes<HTMLElement> {
  items: BottomNavItem[];
  activeIndex: number;
  onNavigate?: (index: number) => void;
}

export const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(
  ({ className, items, activeIndex, onNavigate, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="Navegação principal"
      className={cn(
        "flex rounded-t-2xl border-t border-outline-variant/40 bg-surface shadow-bar",
        className,
      )}
      {...props}
    >
      {items.map((item, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={item.label}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onNavigate?.(index)}
            className={cn(
              "flex min-h-16 flex-1 flex-col items-center justify-center gap-1 transition-opacity focus-visible:outline-2 focus-visible:outline-primary",
              active
                ? "font-semibold text-primary"
                : "text-on-surface-variant/60 hover:text-on-surface-variant",
            )}
          >
            <span aria-hidden className={cn("[&_svg]:size-5", active && "[&_svg]:fill-current")}>
              {item.icon}
            </span>
            <span className="text-overline normal-case tracking-normal">{item.label}</span>
          </button>
        );
      })}
    </nav>
  ),
);
BottomNav.displayName = "BottomNav";
