import { renderWithProviders } from "@/test/render";
import { screen } from "@testing-library/react";
import StudioHome from "./page";
import { getMe } from "@/lib/api/auth";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/api/auth", () => ({
  getMe: jest.fn(),
  logout: jest.fn(),
}));

describe("Studio home", () => {
  beforeEach(() => {
    (getMe as jest.Mock).mockResolvedValue({
      id: "2",
      name: "Bia",
      email: "bia@zenith.test",
      role: "TRAINER",
      createdAt: "2026-01-15T12:00:00.000Z",
    });
  });

  it("renders the trainer area heading", () => {
    renderWithProviders(<StudioHome />);
    expect(
      screen.getByRole("heading", { name: /área do treinador/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });
});
