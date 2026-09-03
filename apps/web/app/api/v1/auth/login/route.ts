import { NextRequest, NextResponse } from "next/server";
import { withAuthCookies } from "@/lib/auth/cookies";
import { forwardNestError, nestFetch } from "@/lib/auth/nest";

export async function POST(request: NextRequest) {
  const body = await request.text();
  let nestRes: Response;
  try {
    nestRes = await nestFetch("/api/v1/auth/login", {
      method: "POST",
      body,
    });
  } catch {
    return NextResponse.json(
      { statusCode: 502, message: "Bad Gateway" },
      { status: 502 },
    );
  }
  if (nestRes.status !== 200) {
    return forwardNestError(nestRes);
  }
  const data = (await nestRes.json()) as {
    user: unknown;
    accessToken: string;
    refreshToken: string;
  };
  return withAuthCookies(
    NextResponse.json(data.user, { status: 200 }),
    data.accessToken,
    data.refreshToken,
  );
}
