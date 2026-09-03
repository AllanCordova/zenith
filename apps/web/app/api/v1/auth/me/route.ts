import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";
import { clearAuthCookies, withAuthCookies } from "@/lib/auth/cookies";
import { nestFetch } from "@/lib/auth/nest";

async function nestMe(accessToken: string): Promise<Response> {
  return nestFetch("/api/v1/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function nestRefresh(refreshToken: string) {
  const nestRes = await nestFetch("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  if (!nestRes.ok) return null;
  return nestRes.json() as Promise<{ accessToken: string; refreshToken: string }>;
}

function unauthorizedClear() {
  return clearAuthCookies(
    NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 },
    ),
  );
}

export async function GET(request: NextRequest) {
  let access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  let rotated: { accessToken: string; refreshToken: string } | null = null;
  if (!access && refresh) {
    try {
      rotated = await nestRefresh(refresh);
    } catch {
      return unauthorizedClear();
    }
    if (!rotated) {
      return unauthorizedClear();
    }
    access = rotated.accessToken;
  }

  let meRes: Response;
  try {
    meRes = await nestMe(access as string);
  } catch {
    return unauthorizedClear();
  }
  if (meRes.status === 401 && refresh && !rotated) {
    try {
      rotated = await nestRefresh(refresh);
    } catch {
      return unauthorizedClear();
    }
    if (!rotated) {
      return unauthorizedClear();
    }
    try {
      meRes = await nestMe(rotated.accessToken);
    } catch {
      return unauthorizedClear();
    }
  }

  if (!meRes.ok) {
    const res = NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 },
    );
    return meRes.status === 401 ? clearAuthCookies(res) : res;
  }

  const user = await meRes.json();
  const res = NextResponse.json(user, { status: 200 });
  if (rotated) {
    return withAuthCookies(res, rotated.accessToken, rotated.refreshToken);
  }
  return res;
}
