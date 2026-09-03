"use client";

import { register } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import type { RegisterInput } from "@/lib/validations/auth";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useRegister() {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (payload: RegisterInput) => register(payload),
    onSuccess: (user) => {
      router.push(user.role === "TRAINER" ? "/studio" : "/app");
    },
  });

  return {
    submit: (data: RegisterInput) => mutation.mutate(data),
    error: mutation.isError
      ? getErrorMessage(mutation.error, "Não foi possível cadastrar")
      : null,
    pending: mutation.isPending,
  };
}
