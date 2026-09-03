import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { nestFetch } from "@/lib/auth/nest";

export async function POST() {
  try {
    await nestFetch("/api/v1/auth/logout", { method: "POST" });
  } catch {
    // best-effort
  }
  return clearAuthCookies(new NextResponse(null, { status: 204 }));
}
