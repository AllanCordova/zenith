import { decideProxy } from "./proxy-gate";

describe("decideProxy", () => {
  it("sends anonymous /app to login", () => {
    expect(decideProxy("/app", { hasSession: false })).toEqual({
      redirect: "/login",
    });
  });

  it("sends CLIENT away from /studio", () => {
    expect(
      decideProxy("/studio", { hasSession: true, role: "CLIENT" }),
    ).toEqual({ redirect: "/app" });
  });

  it("sends TRAINER from /login to /studio", () => {
    expect(
      decideProxy("/login", { hasSession: true, role: "TRAINER" }),
    ).toEqual({ redirect: "/studio" });
  });

  it("lets CLIENT stay on /app", () => {
    expect(
      decideProxy("/app", { hasSession: true, role: "CLIENT" }),
    ).toBeNull();
  });

  it("lets session without role through /app (refresh-only)", () => {
    expect(decideProxy("/app", { hasSession: true })).toBeNull();
  });

  it("sends / with CLIENT to /app", () => {
    expect(decideProxy("/", { hasSession: true, role: "CLIENT" })).toEqual({
      redirect: "/app",
    });
  });
});
