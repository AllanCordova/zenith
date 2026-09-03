import { render, screen } from "@testing-library/react";
import { Field } from "./field";
import { Input } from "./input";

describe("Field", () => {
  it("renders the label and input together", () => {
    render(
      <Field id="email" label="E-mail">
        <Input id="email" />
      </Field>,
    );
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
  });

  it("shows a validation error", () => {
    render(
      <Field id="email" label="E-mail" error="Informe o e-mail">
        <Input id="email" />
      </Field>,
    );
    expect(screen.getByText("Informe o e-mail")).toBeInTheDocument();
  });
});
