import { getMe, logout } from "@/lib/api/auth";
import { useLogout, useSession } from "./use-session";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/api/auth", () => ({
  getMe: jest.fn(),
  logout: jest.fn(),
}));

const mockedGetMe = getMe as jest.MockedFunction<typeof getMe>;
const mockedLogout = logout as jest.MockedFunction<typeof logout>;
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

describe("useSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the current user", async () => {
    mockedGetMe.mockResolvedValue(user);
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(user);
  });
});

describe("useLogout", () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ push } as never);
  });

  it("redirects to login after logout", async () => {
    mockedLogout.mockResolvedValue(undefined);
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });
    result.current.logout();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });
});
