import { render, screen } from "@testing-library/react";
import { Radio, RadioGroup } from "./radio";

describe("RadioGroup", () => {
  it("renders options without a default selection", () => {
    render(
      <RadioGroup legend="Papel">
        <Radio name="role" value="CLIENT" label="Aluno" />
        <Radio name="role" value="TRAINER" label="Treinador" />
      </RadioGroup>,
    );
    expect(screen.getByRole("radio", { name: /aluno/i })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /treinador/i })).not.toBeChecked();
  });

  it("shows a validation error", () => {
    render(
      <RadioGroup legend="Papel" error="Selecione o papel">
        <Radio name="role" value="CLIENT" label="Aluno" />
      </RadioGroup>,
    );
    expect(screen.getByText("Selecione o papel")).toBeInTheDocument();
  });
});
