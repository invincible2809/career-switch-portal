import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// shadcn/ui-style button (the shadcn registry isn't reachable from this environment, so components are written by hand).
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold no-underline transition-colors disabled:pointer-events-none disabled:opacity-60 min-h-11 px-4 py-2 text-base",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover hover:text-on-primary",
        secondary: "border border-primary bg-surface text-primary hover:bg-primary-soft",
        ghost: "text-primary hover:bg-primary-soft",
        danger: "bg-danger text-white hover:bg-[#8f1c13] hover:text-white",
      },
      size: { default: "", sm: "min-h-9 px-3 py-1 text-sm" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
