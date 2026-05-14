"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "gold" | "destructive" | "link";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "icon";
  asChild?: boolean;
  loading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary text-text-inverse hover:bg-primary-dark active:scale-[0.98] shadow-sm hover:shadow-md",
  secondary:
    "bg-cream text-text-primary border border-parchment hover:bg-parchment active:scale-[0.98]",
  ghost:
    "bg-transparent text-text-primary hover:bg-primary-50 hover:text-primary active:scale-[0.98]",
  outline:
    "bg-transparent border border-primary text-primary hover:bg-primary hover:text-text-inverse active:scale-[0.98]",
  gold:
    "bg-gold text-[#1C1410] hover:bg-gold-dark active:scale-[0.98] shadow-sm hover:shadow-md",
  destructive:
    "bg-error text-white hover:bg-red-700 active:scale-[0.98]",
  link:
    "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  xs:   "h-7 px-3 text-[11px] font-semibold tracking-wide rounded-sm gap-1",
  sm:   "h-9 px-4 text-sm font-medium rounded-sm gap-1.5",
  md:   "h-11 px-6 text-sm font-medium rounded-sm gap-2",
  lg:   "h-13 px-8 text-base font-medium rounded-sm gap-2",
  xl:   "h-14 px-10 text-base font-semibold rounded-sm gap-2",
  icon: "h-10 w-10 rounded-sm p-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const cls = cn(
      "inline-flex items-center justify-center",
      "font-body font-medium",
      "transition-all duration-normal",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:pointer-events-none",
      "cursor-pointer select-none",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (asChild) {
      return (
        <Slot className={cls} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button className={cls} ref={ref} disabled={disabled || loading} {...props}>
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
