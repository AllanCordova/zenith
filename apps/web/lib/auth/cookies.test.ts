import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./constants";
import { clearAuthCookies, withAuthCookies } from "./cookies";

describe("auth cookies", () => {
  it("sets httpOnly cookies without exposing tokens in JSON", () => {
    const res = withAuthCookies(
      NextResponse.json({ id: "1" }),
      "access-token",
      "refresh-token",
    );
    const cookies = res.headers.getSetCookie().join("\n");
    expect(cookies).toMatch(new RegExp(`${ACCESS_COOKIE}=access-token`));
    expect(cookies).toMatch(new RegExp(`${REFRESH_COOKIE}=refresh-token`));
    expect(cookies).toMatch(/HttpOnly/i);
    expect(cookies).toMatch(/SameSite=Lax/i);
    expect(cookies).not.toMatch(/Secure/i);
  });

  it("clears cookies with Max-Age=0", () => {
    const res = clearAuthCookies(NextResponse.json(null, { status: 204 }));
    const cookies = res.headers.getSetCookie().join("\n");
    expect(cookies).toMatch(/Max-Age=0/i);
  });
});
