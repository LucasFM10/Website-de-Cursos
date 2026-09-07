import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "./badge";

export interface CourseCardProps extends React.HTMLAttributes<HTMLElement> {
  /** Vertical photography of the finished piece (3:4 or 4:5 crop). */
  imageSrc: string;
  imageAlt: string;
  /** Bag model name, set in Playfair Display. */
  title: string;
  /** Short technical description (techniques, materials). */
  description: string;
  /** Formatted price, e.g. "R$ 497". */
  price: string;
  /** Level tag floated over the photo, e.g. "BÁSICO". */
  level?: string;
  /** Label of the minimalist action link. */
  actionLabel?: string;
  onAction?: () => void;
}

export const CourseCard = React.forwardRef<HTMLElement, CourseCardProps>(
  (
    {
      className,
      imageSrc,
      imageAlt,
      title,
      description,
      price,
      level,
      actionLabel = "Ver curso",
      onAction,
      ...props
    },
    ref,
  ) => (
    <article
      ref={ref}
      className={cn(
        "overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest",
        className,
      )}
      {...props}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={imageSrc}
          alt={imageAlt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {level && <Badge variant="level" className="absolute top-3 left-3">{level}</Badge>}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-title">{title}</h3>
        <p className="text-body-sm text-on-surface-variant">{description}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-price text-primary">{price}</span>
          <button
            type="button"
            onClick={onAction}
            className="inline-flex min-h-12 items-center gap-1 text-label font-semibold text-primary transition-colors hover:text-primary-container focus-visible:outline-2 focus-visible:outline-primary"
          >
            {actionLabel}
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  ),
);
CourseCard.displayName = "CourseCard";
