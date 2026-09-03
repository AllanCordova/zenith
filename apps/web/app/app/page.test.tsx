import { renderWithProviders } from "@/test/render";
import { screen } from "@testing-library/react";
import AppHome from "./page";
import { getMe } from "@/lib/api/auth";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/api/auth", () => ({
  getMe: jest.fn(),
  logout: jest.fn(),
}));

describe("App home", () => {
  beforeEach(() => {
    (getMe as jest.Mock).mockResolvedValue({
      id: "1",
      name: "Ana",
      email: "ana@zenith.test",
      role: "CLIENT",
      createdAt: "2026-01-15T12:00:00.000Z",
    });
  });

  it("renders the student area heading", () => {
    renderWithProviders(<AppHome />);
    expect(
      screen.getByRole("heading", { name: /área do aluno/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });
});
