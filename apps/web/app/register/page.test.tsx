import { renderWithProviders } from "@/test/render";
import { screen } from "@testing-library/react";
import RegisterPage from "./page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("RegisterPage", () => {
  it("renders required fields including role choice without default", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    const client = screen.getByRole("radio", { name: /sou aluno/i });
    const trainer = screen.getByRole("radio", { name: /sou profissional/i });
    expect(client).not.toBeChecked();
    expect(trainer).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: /criar conta/i }),
    ).toBeInTheDocument();
  });
});
