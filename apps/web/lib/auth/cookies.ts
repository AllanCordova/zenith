import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
} from "./constants";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  };
}

export function withAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
): NextResponse {
  res.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
  res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
  return res;
}

export function clearAuthCookies(res: NextResponse): NextResponse {
  res.cookies.set(ACCESS_COOKIE, "", cookieOptions(0));
  res.cookies.set(REFRESH_COOKIE, "", cookieOptions(0));
  return res;
}
