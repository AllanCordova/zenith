import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";
import { decodeJwtPayload } from "@/lib/auth/jwt-payload";
import { decideProxy } from "@/lib/auth/proxy-gate";

export function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const payload =
    (access ? decodeJwtPayload(access) : null) ??
    (refresh ? decodeJwtPayload(refresh) : null);
  const role =
    payload?.role === "CLIENT" || payload?.role === "TRAINER"
      ? payload.role
      : undefined;
  const decision = decideProxy(request.nextUrl.pathname, {
    hasSession: Boolean(access || refresh),
    role,
  });
  if (decision) {
    return NextResponse.redirect(new URL(decision.redirect, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/app/:path*", "/studio/:path*"],
};
