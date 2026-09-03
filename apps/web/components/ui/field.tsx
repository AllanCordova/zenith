import { cn } from "@/lib/cn";
import { Label } from "./label";
import type { ReactNode } from "react";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
  srOnlyLabel?: boolean;
  labelClassName?: string;
  className?: string;
};

export function Field({
  id,
  label,
  error,
  children,
  srOnlyLabel,
  labelClassName,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Label
        htmlFor={id}
        className={cn(srOnlyLabel && "sr-only", labelClassName)}
      >
        {label}
      </Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
