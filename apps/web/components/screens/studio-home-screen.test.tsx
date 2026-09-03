import { StudioHomeScreen } from "./studio-home-screen";
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

describe("StudioHomeScreen", () => {
  beforeEach(() => {
    mockedGetMe.mockResolvedValue({
      id: "2",
      name: "Bia",
      email: "bia@zenith.test",
      role: "TRAINER",
      createdAt: "2026-01-15T12:00:00.000Z",
    });
  });

  it("renders the trainer area heading", () => {
    renderWithProviders(<StudioHomeScreen />);
    expect(
      screen.getByRole("heading", { name: /área do treinador/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });
});
