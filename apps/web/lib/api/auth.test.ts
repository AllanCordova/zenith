import { getMe, login, logout, register } from "./auth";
import { api } from "./client";

jest.mock("./client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
};

const user = {
  id: "1",
  name: "Ana",
  email: "ana@zenith.test",
  role: "CLIENT" as const,
  createdAt: "2026-01-15T12:00:00.000Z",
};

describe("auth api", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("posts login credentials and returns the user", async () => {
    mockedApi.post.mockResolvedValue({ data: user });
    await expect(
      login({ email: "ana@zenith.test", password: "password1" }),
    ).resolves.toEqual(user);
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/login", {
      email: "ana@zenith.test",
      password: "password1",
    });
  });

  it("posts register payload and returns the user", async () => {
    mockedApi.post.mockResolvedValue({ data: user });
    const payload = {
      name: "Ana",
      email: "ana@zenith.test",
      password: "password1",
      role: "CLIENT" as const,
    };
    await expect(register(payload)).resolves.toEqual(user);
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/register", payload);
  });

  it("gets the current user", async () => {
    mockedApi.get.mockResolvedValue({ data: user });
    await expect(getMe()).resolves.toEqual(user);
    expect(mockedApi.get).toHaveBeenCalledWith("/auth/me");
  });

  it("posts logout", async () => {
    mockedApi.post.mockResolvedValue({ data: null });
    await expect(logout()).resolves.toBeUndefined();
    expect(mockedApi.post).toHaveBeenCalledWith("/auth/logout");
  });
});
