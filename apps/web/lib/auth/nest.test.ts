import { nestFetch } from "./nest";

describe("nestFetch", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("merges Headers instances without dropping Authorization", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response("ok"));
    await nestFetch("/api/v1/auth/me", {
      method: "GET",
      headers: new Headers({ Authorization: "Bearer tok" }),
    });
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer tok");
    expect(headers.get("content-type")).toBe("application/json");
  });
});
