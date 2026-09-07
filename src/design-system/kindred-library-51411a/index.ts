// Artisanal Elegance — design system barrel.
// Consumers import from "@/design-system/kindred-library-51411a/design-system/{slug}" via this file.
//
// Font requirement: this system pairs "Playfair Display" (brand voice) with
// "Inter" (interface). Load both in the consumer's document head:
// <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap">
// The theme file (styles/theme.css) references the families via
// --font-display / --font-sans; it does not load the fonts itself.

export { cn } from "./lib/utils";

export { Button, buttonVariants, type ButtonProps } from "./components/button";
export { Badge, type BadgeProps } from "./components/badge";
export { Card, CardContent, type CardProps } from "./components/card";
export { CourseCard, type CourseCardProps } from "./components/course-card";
export { Input, type InputProps } from "./components/input";
export { Label, type LabelProps } from "./components/label";
export { RadioCard, type RadioCardProps } from "./components/radio-card";
export { TopAppBar, type TopAppBarProps } from "./components/top-app-bar";
export { BottomNav, type BottomNavProps, type BottomNavItem } from "./components/bottom-nav";
export {
  StickyPurchaseBar,
  type StickyPurchaseBarProps,
} from "./components/sticky-purchase-bar";
export { Divider, type DividerProps } from "./components/divider";
