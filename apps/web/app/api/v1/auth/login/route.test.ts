import { NextRequest } from "next/server";
import { POST } from "./route";

const user = {
  id: "1",
  name: "Ana",
  email: "ana@zenith.test",
  role: "CLIENT",
  createdAt: "2026-01-15T12:00:00.000Z",
};

describe("POST /api/v1/auth/login", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sets httpOnly cookies and returns only the user", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          user,
          accessToken: "acc",
          refreshToken: "ref",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "ana@zenith.test",
        password: "password1",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(user);
    const cookies = res.headers.getSetCookie().join("\n");
    expect(cookies).toMatch(/zenith_access=acc/);
    expect(cookies).toMatch(/HttpOnly/i);
  });

  it("returns 502 without session cookies when Nest is unreachable", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("down"));
    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "ana@zenith.test",
        password: "password1",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      statusCode: 502,
      message: "Bad Gateway",
    });
    expect(res.headers.getSetCookie().join("\n")).not.toMatch(/zenith_access=/);
  });

  it("forwards 401 without session cookies", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );
    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "ana@zenith.test",
        password: "password1",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie().join("\n")).not.toMatch(/zenith_access=acc/);
  });
});
