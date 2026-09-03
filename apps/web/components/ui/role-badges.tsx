import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

const OPTIONS = [
  { value: "TRAINER", label: "Sou Profissional" },
  { value: "CLIENT", label: "Sou Aluno" },
] as const;

type Role = "TRAINER" | "CLIENT";

type RoleBadgesProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "size"
> & {
  value?: Role | "";
  error?: string;
};

export const RoleBadges = forwardRef<HTMLInputElement, RoleBadgesProps>(
  function RoleBadges(
    { className, error, name, onBlur, onChange, value, ...props },
    ref,
  ) {
    const isControlled = value !== undefined;

    return (
      <fieldset className={cn("flex w-full flex-col gap-2", className)}>
        <legend className="sr-only">Papel</legend>
        <div className="flex w-full rounded-lg border border-outline-variant bg-surface-container-low p-1">
          {OPTIONS.map((option, index) => (
            <label
              key={option.value}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center rounded py-2 text-center text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-all",
                "hover:text-on-background",
                "has-[:checked]:bg-primary-container has-[:checked]:text-background has-[:checked]:shadow-[0_0_8px_rgba(57,255,20,0.2)]",
              )}
            >
              <input
                {...props}
                ref={index === 0 ? ref : undefined}
                type="radio"
                name={name}
                value={option.value}
                checked={isControlled ? value === option.value : undefined}
                onChange={onChange}
                onBlur={onBlur}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </fieldset>
    );
  },
);

