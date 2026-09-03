import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("px-4", "text-foreground", "bg-primary")).toBe(
      "px-4 text-foreground bg-primary",
    );
  });

  it("omits false, null and undefined values", () => {
    expect(cn("block", false, null, undefined, "hidden")).toBe("block hidden");
  });
});
