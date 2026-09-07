import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/*
 * Artisanal Elegance defines custom `text-*` typography utilities
 * (text-display, text-headline-lg, text-body-sm, text-label, ...) in
 * theme.css. tailwind-merge cannot tell these apart from `text-{color}`
 * utilities, so it strips the variant's text color (e.g. text-on-primary)
 * whenever a typography utility follows it — leaving primary buttons with
 * dark body text instead of white. Group the custom typography utilities
 * under "font-size" so they only conflict with each other, never with
 * text-color utilities.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display",
        "text-headline-lg",
        "text-headline-md",
        "text-headline-sm",
        "text-price",
        "text-title",
        "text-body-lg",
        "text-body-md",
        "text-body-sm",
        "text-label",
        "text-overline",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
