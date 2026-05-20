"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id ?? React.useId();
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full h-11 px-4 py-2.5",
              "bg-ivory border border-parchment rounded-sm",
              "text-body-base text-text-primary placeholder:text-text-disabled",
              "font-body",
              "transition-colors duration-fast",
              "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-error focus:border-error focus:ring-error",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-[13px] text-error font-medium">{error}</p>}
        {hint && !error && <p className="text-[13px] text-text-muted">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? React.useId();
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "w-full px-4 py-3 min-h-[100px]",
            "bg-ivory border border-parchment rounded-sm resize-y",
            "text-body-base text-text-primary placeholder:text-text-disabled font-body",
            "transition-colors duration-fast",
            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-error focus:border-error focus:ring-error",
            className
          )}
          {...props}
        />
        {error && <p className="text-[13px] text-error font-medium">{error}</p>}
        {hint && !error && <p className="text-[13px] text-text-muted">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
