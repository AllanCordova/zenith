import { NextRequest } from "next/server";
import { POST } from "./route";

function reqWithRefresh() {
  return new NextRequest("http://localhost:3000/api/v1/auth/refresh", {
    method: "POST",
    headers: { cookie: "zenith_refresh=old-refresh" },
  });
}

describe("POST /api/v1/auth/refresh", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renews cookies on Nest success", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ accessToken: "new-acc", refreshToken: "new-ref" }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const res = await POST(reqWithRefresh());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeUndefined();
    expect(res.headers.getSetCookie().join("\n")).toMatch(/zenith_access=new-acc/);
  });

  it("clears cookies on Nest 401", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), {
        status: 401,
      }),
    );
    const res = await POST(reqWithRefresh());
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie().join("\n")).toMatch(/Max-Age=0/i);
  });

  it("clears cookies when fetch rejects", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("down"));
    const res = await POST(reqWithRefresh());
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie().join("\n")).toMatch(/Max-Age=0/i);
  });
});
