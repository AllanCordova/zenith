"use client";

import { getMe, logout } from "@/lib/api/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const sessionQueryKey = ["auth", "me"] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => getMe(),
    retry: false,
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      queryClient.clear();
      router.push("/login");
    },
  });

  return {
    logout: () => mutation.mutate(),
    pending: mutation.isPending,
  };
}
