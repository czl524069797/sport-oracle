import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan shadow-neon-cyan/20",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-red-500/30 bg-red-500/10 text-red-400",
        outline: "text-foreground border-border",
        success: "border-neon-green/30 bg-neon-green/10 text-neon-green",
        warning: "border-neon-orange/30 bg-neon-orange/10 text-neon-orange",
        live: "border-red-500/50 bg-red-500/15 text-red-400 live-indicator",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
