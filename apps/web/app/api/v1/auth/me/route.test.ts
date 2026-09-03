import { NextRequest } from "next/server";
import { GET } from "./route";

const user = {
  id: "1",
  name: "Ana",
  email: "ana@zenith.test",
  role: "CLIENT",
  createdAt: "2026-01-15T12:00:00.000Z",
};

describe("GET /api/v1/auth/me", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the user when access is valid", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(user), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const res = await GET(
      new NextRequest("http://localhost:3000/api/v1/auth/me", {
        headers: { cookie: "zenith_access=acc; zenith_refresh=ref" },
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(user);
  });

  it("refreshes once when access is rejected", async () => {
    const fetchMock = jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ accessToken: "new-acc", refreshToken: "new-ref" }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(user), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    const res = await GET(
      new NextRequest("http://localhost:3000/api/v1/auth/me", {
        headers: { cookie: "zenith_access=stale; zenith_refresh=ref" },
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(user);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(res.headers.getSetCookie().join("\n")).toMatch(/zenith_access=new-acc/);
  });

  it("clears cookies when fetch rejects", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("down"));
    const res = await GET(
      new NextRequest("http://localhost:3000/api/v1/auth/me", {
        headers: { cookie: "zenith_access=acc; zenith_refresh=ref" },
      }),
    );
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie().join("\n")).toMatch(/Max-Age=0/i);
  });
});
