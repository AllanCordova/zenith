import { RegisterForm } from "./register-form";
import { renderWithProviders } from "@/test/render";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { register } from "@/lib/api/auth";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/api/auth", () => ({
  register: jest.fn(),
}));

const mockedRegister = register as jest.MockedFunction<typeof register>;

describe("RegisterForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders required fields including role choice without default", () => {
    renderWithProviders(<RegisterForm />);
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
  });

  it("submits a valid student registration", async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValue({
      id: "1",
      name: "Ana",
      email: "ana@zenith.test",
      role: "CLIENT",
      createdAt: "2026-01-15T12:00:00.000Z",
    });
    renderWithProviders(<RegisterForm />);
    await user.type(screen.getByLabelText(/nome/i), "Ana");
    await user.type(screen.getByLabelText(/e-mail/i), "ana@zenith.test");
    await user.type(screen.getByLabelText(/senha/i), "password1");
    await user.click(screen.getByRole("radio", { name: /sou aluno/i }));
    await user.click(screen.getByRole("button", { name: /criar conta/i }));
    expect(mockedRegister).toHaveBeenCalledWith({
      name: "Ana",
      email: "ana@zenith.test",
      password: "password1",
      role: "CLIENT",
    });
  });

  it("submits a valid trainer registration", async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValue({
      id: "2",
      name: "Carlos",
      email: "carlos@zenith.test",
      role: "TRAINER",
      createdAt: "2026-01-15T12:00:00.000Z",
    });
    renderWithProviders(<RegisterForm />);
    await user.type(screen.getByLabelText(/nome/i), "Carlos");
    await user.type(screen.getByLabelText(/e-mail/i), "carlos@zenith.test");
    await user.type(screen.getByLabelText(/senha/i), "password1");
    await user.click(screen.getByRole("radio", { name: /sou profissional/i }));
    await user.click(screen.getByRole("button", { name: /criar conta/i }));
    expect(mockedRegister).toHaveBeenCalledWith({
      name: "Carlos",
      email: "carlos@zenith.test",
      password: "password1",
      role: "TRAINER",
    });
  });
});
