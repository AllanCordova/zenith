import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center overflow-y-auto bg-[#131313] p-6 text-on-background antialiased">
      <div className="flex w-full max-w-md flex-col items-center">{children}</div>
    </main>
  );
}
