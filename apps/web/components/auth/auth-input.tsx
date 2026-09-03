import { AuthIcon } from "@/components/auth/auth-icon";
import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: "mail" | "lock" | "person";
  trailing?: ReactNode;
};

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  function AuthInput({ icon, trailing, className, ...props }, ref) {
    return (
      <div className="relative">
        <AuthIcon
          name={icon}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
        <input
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 text-base text-on-background outline-none transition-all",
            "placeholder:text-on-surface-variant/70",
            "focus:border-primary-container focus:shadow-[0_0_8px_rgba(57,255,20,0.2)] focus:ring-1 focus:ring-primary-container",
            trailing ? "pr-10" : "pr-3",
            className,
          )}
          {...props}
        />
        {trailing ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {trailing}
          </div>
        ) : null}
      </div>
    );
  },
);
