import { POST } from "./route";

describe("POST /api/v1/auth/logout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("clears cookies even when Nest fails", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("down"));
    const res = await POST();
    expect(res.status).toBe(204);
    expect(res.headers.getSetCookie().join("\n")).toMatch(/Max-Age=0/i);
  });
});
