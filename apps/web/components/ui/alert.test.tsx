import { render, screen } from "@testing-library/react";
import { Alert } from "./alert";

describe("Alert", () => {
  it("exposes the message as an alert", () => {
    render(<Alert>Não foi possível entrar</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível entrar");
  });
});
