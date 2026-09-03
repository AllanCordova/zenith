import { LoginForm } from "./login-form";
import { renderWithProviders } from "@/test/render";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { login } from "@/lib/api/auth";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/api/auth", () => ({
  login: jest.fn(),
}));

const mockedLogin = login as jest.MockedFunction<typeof login>;

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders email, password and submit", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(await screen.findByText("Informe o e-mail")).toBeInTheDocument();
    expect(
      screen.getByText("A senha deve ter no mínimo 8 caracteres"),
    ).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    const password = screen.getByLabelText("Senha");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: /mostrar senha/i }));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: /ocultar senha/i }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("submits valid credentials", async () => {
    const user = userEvent.setup();
    mockedLogin.mockResolvedValue({
      id: "1",
      name: "Ana",
      email: "ana@zenith.test",
      role: "CLIENT",
      createdAt: "2026-01-15T12:00:00.000Z",
    });
    renderWithProviders(<LoginForm />);
    await user.type(screen.getByLabelText(/e-mail/i), "ana@zenith.test");
    await user.type(screen.getByLabelText("Senha"), "password1");
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(mockedLogin).toHaveBeenCalledWith({
      email: "ana@zenith.test",
      password: "password1",
    });
  });
});
