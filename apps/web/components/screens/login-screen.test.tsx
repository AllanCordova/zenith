import { LoginScreen } from "./login-screen";
import { renderWithProviders } from "@/test/render";
import { screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("LoginScreen", () => {
  it("renders a centered form with logo and without role badges", () => {
    renderWithProviders(<LoginScreen />);
    expect(screen.getByRole("img", { name: /zenith/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /bem-vindo de volta/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: /sou profissional/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: /sou aluno/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /criar conta/i })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
