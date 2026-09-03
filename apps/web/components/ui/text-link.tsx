import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ComponentProps } from "react";

export function TextLink({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "text-primary underline-offset-4 hover:underline",
        className,
      )}
      {...props}
    />
  );
}
