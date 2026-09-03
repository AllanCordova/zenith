"use client";

import { Button } from "@/components/ui/button";
import { useLogout, useSession } from "@/hooks/use-session";

export function UserSession() {
  const { data } = useSession();
  const { logout, pending } = useLogout();

  return (
    <div className="flex items-center gap-4">
      {data?.name ? <p>Olá, {data.name}</p> : null}
      <Button variant="outline" onClick={() => logout()} disabled={pending}>
        Sair
      </Button>
    </div>
  );
}
