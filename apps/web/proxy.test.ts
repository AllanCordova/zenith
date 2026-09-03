import { NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { proxy } from "./proxy";

function fakeJwt(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
    "base64url",
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.sig`;
}

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("proxy", () => {
  it("redirects /app with no cookies to /login", () => {
    const res = proxy(request("/app"));
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("redirects CLIENT access cookie away from /studio to /app", () => {
    const token = fakeJwt({ role: "CLIENT", type: "access" });
    const res = proxy(request("/studio", `${ACCESS_COOKIE}=${token}`));
    expect(res.headers.get("location")).toBe("http://localhost:3000/app");
  });

  it("redirects TRAINER from /login to /studio", () => {
    const token = fakeJwt({ role: "TRAINER", type: "access" });
    const res = proxy(request("/login", `${ACCESS_COOKIE}=${token}`));
    expect(res.headers.get("location")).toBe("http://localhost:3000/studio");
  });
});
