import { loginSchema, registerSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts a valid payload", () => {
    expect(
      loginSchema.parse({
        email: "ana@zenith.test",
        password: "password1",
      }),
    ).toEqual({
      email: "ana@zenith.test",
      password: "password1",
    });
  });

  it("rejects an empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "password1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain("Informe o e-mail");
    }
  });

  it("rejects a short password", () => {
    const result = loginSchema.safeParse({
      email: "ana@zenith.test",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        "A senha deve ter no mínimo 8 caracteres",
      );
    }
  });
});

describe("registerSchema", () => {
  it("accepts a valid payload", () => {
    expect(
      registerSchema.parse({
        name: "Ana",
        email: "ana@zenith.test",
        password: "password1",
        role: "CLIENT",
      }),
    ).toEqual({
      name: "Ana",
      email: "ana@zenith.test",
      password: "password1",
      role: "CLIENT",
    });
  });

  it("requires a role", () => {
    const result = registerSchema.safeParse({
      name: "Ana",
      email: "ana@zenith.test",
      password: "password1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.role).toContain("Selecione o papel");
    }
  });
});
