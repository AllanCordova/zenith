import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE } from "@/lib/auth/constants";
import { clearAuthCookies, withAuthCookies } from "@/lib/auth/cookies";
import { nestFetch } from "@/lib/auth/nest";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return clearAuthCookies(
      NextResponse.json(
        { statusCode: 401, message: "Unauthorized" },
        { status: 401 },
      ),
    );
  }
  let nestRes: Response;
  try {
    nestRes = await nestFetch("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return clearAuthCookies(
      NextResponse.json(
        { statusCode: 401, message: "Unauthorized" },
        { status: 401 },
      ),
    );
  }
  if (!nestRes.ok) {
    return clearAuthCookies(
      NextResponse.json(
        { statusCode: 401, message: "Unauthorized" },
        { status: 401 },
      ),
    );
  }
  const tokens = (await nestRes.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  return withAuthCookies(NextResponse.json({ ok: true }), tokens.accessToken, tokens.refreshToken);
}
