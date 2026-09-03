import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders the label and defaults to type button", () => {
    render(<Button>Entrar</Button>);
    expect(screen.getByRole("button", { name: /entrar/i })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("can be disabled", () => {
    render(<Button disabled>Entrar</Button>);
    expect(screen.getByRole("button", { name: /entrar/i })).toBeDisabled();
  });
});
