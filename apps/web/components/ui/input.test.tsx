import { render, screen } from "@testing-library/react";
import { Input } from "./input";

describe("Input", () => {
  it("associates with a label via id", () => {
    render(
      <label htmlFor="email">
        E-mail
        <Input id="email" name="email" />
      </label>,
    );
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
  });
});
