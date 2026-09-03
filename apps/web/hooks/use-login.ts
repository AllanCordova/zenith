"use client";

import { login } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import type { LoginInput } from "@/lib/validations/auth";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useLogin() {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (payload: LoginInput) => login(payload),
    onSuccess: (user) => {
      router.push(user.role === "TRAINER" ? "/studio" : "/app");
    },
  });

  return {
    submit: (data: LoginInput) => mutation.mutate(data),
    error: mutation.isError
      ? getErrorMessage(mutation.error, "Não foi possível entrar")
      : null,
    pending: mutation.isPending,
  };
}
