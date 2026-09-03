"use client";

import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthInput } from "@/components/auth/auth-input";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { RoleBadges } from "@/components/ui/role-badges";
import { useRegister } from "@/hooks/use-register";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";

const labelClassName =
  "text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant";

export function RegisterForm() {
  const { submit, error, pending } = useRegister();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <form
      onSubmit={handleSubmit((data) => submit(data))}
      className="flex w-full flex-col gap-4"
    >
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <RoleBadges
            name={field.name}
            value={field.value ?? ""}
            onChange={(event) => field.onChange(event.target.value)}
            onBlur={field.onBlur}
            error={errors.role?.message}
          />
        )}
      />
      <Field
        id="name"
        label="Nome completo"
        error={errors.name?.message}
        labelClassName={labelClassName}
      >
        <AuthInput
          id="name"
          autoComplete="name"
          placeholder="Ex: Carlos Silva"
          icon="person"
          {...register("name")}
        />
      </Field>
      <Field
        id="email"
        label="E-mail"
        error={errors.email?.message}
        labelClassName={labelClassName}
      >
        <AuthInput
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nome@exemplo.com"
          icon="mail"
          {...register("email")}
        />
      </Field>
      <Field
        id="password"
        label="Senha"
        error={errors.password?.message}
        labelClassName={labelClassName}
      >
        <AuthInput
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          icon="lock"
          {...register("password")}
        />
      </Field>
      {error ? <Alert>{error}</Alert> : null}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded bg-primary-container py-3 text-xs font-bold uppercase tracking-wider text-on-primary-fixed-variant transition-all hover:shadow-[0_0_12px_rgba(57,255,20,0.4)] disabled:pointer-events-none disabled:opacity-50"
      >
        <span>Criar conta</span>
        <AuthIcon name="arrow_forward" className="h-4 w-4" />
      </button>
      <div className="mt-6 flex w-full flex-col items-center gap-4 border-t border-surface-variant pt-6 text-center">
        <p className="text-sm text-on-surface-variant">
          Ao criar uma conta, você concorda com nossos Termos de Uso e Política
          de Privacidade.
        </p>
        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-2 rounded border border-surface-variant px-6 py-2 text-base text-on-background transition-colors hover:border-primary-container hover:bg-primary-container/5 hover:text-primary-container"
        >
          <AuthIcon name="login" className="h-4 w-4" />
          <span>Já tem uma conta? Fazer Login</span>
        </Link>
      </div>
    </form>
  );
}
