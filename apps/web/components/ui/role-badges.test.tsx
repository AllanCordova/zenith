import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleBadges } from "./role-badges";

describe("RoleBadges", () => {
  it("renders trainer and student badges without a default selection", () => {
    render(<RoleBadges name="role" />);

    expect(
      screen.getByRole("radio", { name: /sou profissional/i }),
    ).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /sou aluno/i })).not.toBeChecked();
  });

  it("selects TRAINER when the professional badge is clicked", async () => {
    const user = userEvent.setup();
    render(<RoleBadges name="role" />);

    await user.click(screen.getByRole("radio", { name: /sou profissional/i }));

    expect(
      screen.getByRole("radio", { name: /sou profissional/i }),
    ).toBeChecked();
    expect(screen.getByRole("radio", { name: /sou aluno/i })).not.toBeChecked();
  });

  it("selects CLIENT when the student badge is clicked", async () => {
    const user = userEvent.setup();
    render(<RoleBadges name="role" />);

    await user.click(screen.getByRole("radio", { name: /sou aluno/i }));

    expect(screen.getByRole("radio", { name: /sou aluno/i })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /sou profissional/i }),
    ).not.toBeChecked();
  });

  it("shows a validation error", () => {
    render(<RoleBadges name="role" error="Selecione o papel" />);

    expect(screen.getByText("Selecione o papel")).toBeInTheDocument();
  });
});
