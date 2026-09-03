import { register } from "@/lib/api/auth";
import { useRegister } from "./use-register";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/api/auth", () => ({
  register: jest.fn(),
}));

const mockedRegister = register as jest.MockedFunction<typeof register>;
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

describe("useRegister", () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ push } as never);
  });

  it("redirects a client to /app after register", async () => {
    mockedRegister.mockResolvedValue(user);
    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });
    result.current.submit({
      name: "Ana",
      email: "ana@zenith.test",
      password: "password1",
      role: "CLIENT",
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app"));
  });

  it("redirects a trainer to /studio after register", async () => {
    mockedRegister.mockResolvedValue({ ...user, role: "TRAINER" });
    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });
    result.current.submit({
      name: "Bia",
      email: "bia@zenith.test",
      password: "password1",
      role: "TRAINER",
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/studio"));
  });
});
