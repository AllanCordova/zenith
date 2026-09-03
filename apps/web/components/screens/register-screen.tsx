import { AuthBrand } from "@/components/auth/auth-brand";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export function RegisterScreen() {
  return (
    <AuthShell>
      <div className="mb-8">
        <AuthBrand size="sm" />
      </div>
      <div className="mb-10 w-full text-center">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-on-background md:text-[32px] md:leading-10">
          Criar conta
        </h1>
        <p className="text-base text-on-surface-variant">
          Escolha se você é profissional ou aluno e preencha seus dados.
        </p>
      </div>
      <RegisterForm />
    </AuthShell>
  );
}
