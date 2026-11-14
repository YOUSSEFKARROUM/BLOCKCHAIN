import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

// Bouton shadcn/ui, adapté au site : forme pilule, retour visuel dès l'appui.
const buttonVariants = cva(
  "inline-flex min-h-[2.75rem] select-none items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-[transform,background-color,opacity] duration-150 active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-white",
        outline: "border border-border bg-white/[0.04] text-foreground hover:bg-white/10",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
        success: "bg-[var(--ok)] text-black hover:opacity-90",
      },
      size: {
        default: "",
        sm: "min-h-[2rem] px-3 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
