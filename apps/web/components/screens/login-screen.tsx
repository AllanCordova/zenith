import { AuthBrand } from "@/components/auth/auth-brand";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export function LoginScreen() {
  return (
    <AuthShell>
      <div className="mb-10 flex flex-col items-center">
        <AuthBrand />
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-on-background md:text-[32px] md:leading-10">
          Bem-vindo de volta
        </h1>
        <p className="text-center text-sm text-on-surface-variant">
          Insira suas credenciais para acessar seu painel
        </p>
      </div>
      <LoginForm />
      <p className="mt-10 text-center text-sm text-on-surface-variant">
        Ainda não tem uma conta?
        <Link
          href="/register"
          className="ml-1 font-semibold text-primary-fixed transition-colors hover:text-primary-fixed-dim"
        >
          Criar conta
        </Link>
      </p>
    </AuthShell>
  );
}
