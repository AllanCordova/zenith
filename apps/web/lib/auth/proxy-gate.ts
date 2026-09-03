export type SessionHint = {
  hasSession: boolean;
  role?: "TRAINER" | "CLIENT";
};

function areaForRole(role: "TRAINER" | "CLIENT"): "/app" | "/studio" {
  return role === "CLIENT" ? "/app" : "/studio";
}

export function decideProxy(
  pathname: string,
  session: SessionHint,
): { redirect: string } | null {
  const isApp = pathname === "/app" || pathname.startsWith("/app/");
  const isStudio = pathname === "/studio" || pathname.startsWith("/studio/");
  const isRoot = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if ((isRoot || isApp || isStudio) && !session.hasSession) {
    return { redirect: "/login" };
  }

  if (isAuthPage && session.hasSession && session.role) {
    return { redirect: areaForRole(session.role) };
  }

  if (isStudio && session.role === "CLIENT") {
    return { redirect: "/app" };
  }
  if (isApp && session.role === "TRAINER") {
    return { redirect: "/studio" };
  }

  if (isRoot && session.role) {
    return { redirect: areaForRole(session.role) };
  }

  return null;
}
