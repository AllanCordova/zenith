import { decodeJwtPayload } from "./jwt-payload";

function fakeJwt(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
    "base64url",
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.sig`;
}

describe("decodeJwtPayload", () => {
  it("reads role from the JWT payload without verifying signature", () => {
    const token = fakeJwt({
      sub: "1",
      email: "ana@zenith.test",
      role: "CLIENT",
      type: "access",
    });
    expect(decodeJwtPayload(token)).toMatchObject({
      role: "CLIENT",
      type: "access",
    });
  });

  it("returns null for garbage", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
  });
});
