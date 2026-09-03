"use client";

import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthInput } from "@/components/auth/auth-input";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { useLogin } from "@/hooks/use-login";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function LoginForm() {
  const { submit, error, pending } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form
      onSubmit={handleSubmit((data) => submit(data))}
      className="flex w-full flex-col gap-4"
    >
      <Field id="email" label="E-mail" error={errors.email?.message} srOnlyLabel>
        <AuthInput
          id="email"
          type="email"
          autoComplete="email"
          placeholder="E-mail"
          icon="mail"
          {...register("email")}
        />
      </Field>
      <Field
        id="password"
        label="Senha"
        error={errors.password?.message}
        srOnlyLabel
      >
        <AuthInput
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Senha"
          icon="lock"
          trailing={
            <button
              type="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="text-on-surface-variant transition-colors hover:text-on-background"
              onClick={() => setShowPassword((visible) => !visible)}
            >
              <AuthIcon name={showPassword ? "visibility_off" : "visibility"} />
            </button>
          }
          {...register("password")}
        />
      </Field>
      {error ? <Alert>{error}</Alert> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-lg bg-primary-container py-3 text-xl font-bold text-[#131313] transition-all hover:shadow-[0_0_15px_rgba(57,255,20,0.4)] disabled:pointer-events-none disabled:opacity-50"
      >
        Entrar na Plataforma
      </button>
    </form>
  );
}
