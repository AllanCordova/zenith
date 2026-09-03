import { AppHomeScreen } from "./app-home-screen";
import { renderWithProviders } from "@/test/render";
import { screen } from "@testing-library/react";
import { getMe } from "@/lib/api/auth";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/api/auth", () => ({
  getMe: jest.fn(),
  logout: jest.fn(),
}));

const mockedGetMe = getMe as jest.MockedFunction<typeof getMe>;

describe("AppHomeScreen", () => {
  beforeEach(() => {
    mockedGetMe.mockResolvedValue({
      id: "1",
      name: "Ana",
      email: "ana@zenith.test",
      role: "CLIENT",
      createdAt: "2026-01-15T12:00:00.000Z",
    });
  });

  it("renders the student area heading", () => {
    renderWithProviders(<AppHomeScreen />);
    expect(
      screen.getByRole("heading", { name: /área do aluno/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });
});
