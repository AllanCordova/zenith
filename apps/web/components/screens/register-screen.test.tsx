import { RegisterScreen } from "./register-screen";
import { renderWithProviders } from "@/test/render";
import { screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("RegisterScreen", () => {
  it("renders a centered form with logo and role choice without default", () => {
    const { container } = renderWithProviders(<RegisterScreen />);
    expect(screen.getByRole("img", { name: /zenith/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /criar conta/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /sou aluno/i }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("radio", { name: /sou profissional/i }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: /criar conta/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/especialidade/i)).not.toBeInTheDocument();
    expect(
      container.querySelector('[style*="background_login_register"]'),
    ).not.toBeInTheDocument();
  });
});
