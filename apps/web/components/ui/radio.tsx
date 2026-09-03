import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, ReactNode } from "react";

type RadioGroupProps = {
  legend: string;
  error?: string;
  children: ReactNode;
};

export function RadioGroup({ legend, error, children }: RadioGroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </fieldset>
  );
}

type RadioProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Radio({ label, className, ...props }: RadioProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input
        type="radio"
        className={cn("accent-primary", className)}
        {...props}
      />
      {label}
    </label>
  );
}
