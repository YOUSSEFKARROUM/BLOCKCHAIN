import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

// Badge shadcn/ui avec les teintes sémantiques du site (statut, risque, vote).
const badgeVariants = cva("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      neutral: "bg-white/[0.08] text-muted-foreground",
      ok: "bg-[rgba(48,209,88,0.16)] text-[var(--ok)]",
      warn: "bg-[rgba(255,214,10,0.14)] text-[var(--warn)]",
      danger: "bg-[rgba(255,69,58,0.16)] text-[var(--danger)]",
      info: "bg-[rgba(100,210,255,0.14)] text-[var(--info)]",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
