import { UserSession } from "@/components/auth/user-session";

export function AppHomeScreen() {
  return (
    <main className="flex flex-1 flex-col gap-4 bg-background p-8">
      <h1 className="text-2xl font-semibold text-foreground">Área do aluno</h1>
      <UserSession />
    </main>
  );
}
