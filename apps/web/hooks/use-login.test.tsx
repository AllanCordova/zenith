import { login } from "@/lib/api/auth";
import { useLogin } from "./use-login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/api/auth", () => ({
  login: jest.fn(),
}));

const mockedLogin = login as jest.MockedFunction<typeof login>;
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const user = {
  id: "1",
  name: "Ana",
  email: "ana@zenith.test",
  role: "CLIENT" as const,
  createdAt: "2026-01-15T12:00:00.000Z",
};

describe("useLogin", () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ push } as never);
  });

  it("redirects a client to /app after login", async () => {
    mockedLogin.mockResolvedValue(user);
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });
    result.current.submit({
      email: "ana@zenith.test",
      password: "password1",
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app"));
  });

  it("redirects a trainer to /studio after login", async () => {
    mockedLogin.mockResolvedValue({ ...user, role: "TRAINER" });
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });
    result.current.submit({
      email: "bia@zenith.test",
      password: "password1",
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/studio"));
  });

  it("exposes the API error message", async () => {
    mockedLogin.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Unauthorized" } },
    });
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });
    result.current.submit({
      email: "ana@zenith.test",
      password: "password1",
    });
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});
