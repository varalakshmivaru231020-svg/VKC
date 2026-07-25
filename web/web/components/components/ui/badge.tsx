import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "gold" | "success" | "error" | "warning" | "outline" | "new" | "sale" | "exclusive";
  size?: "sm" | "md";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:   "bg-cream text-text-secondary border border-parchment",
  primary:   "bg-primary text-text-inverse",
  gold:      "bg-gold text-[#1C1410]",
  success:   "bg-success-bg text-success border border-success/20",
  error:     "bg-error-bg text-error border border-error/20",
  warning:   "bg-warning-bg text-warning border border-warning/20",
  outline:   "bg-transparent border border-primary text-primary",
  new:       "bg-[#1B4B6B] text-white",
  sale:      "bg-error text-white",
  exclusive: "bg-primary text-gold-light",
};

const sizeClasses: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-[11px]",
};

export function Badge({ className, variant = "default", size = "md", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        "font-body font-semibold tracking-wide uppercase rounded-xs",
        "whitespace-nowrap leading-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
