import { render, screen } from "@testing-library/react";
import { Label } from "./label";

describe("Label", () => {
  it("renders the text", () => {
    render(<Label htmlFor="email">E-mail</Label>);
    expect(screen.getByText(/e-mail/i)).toBeInTheDocument();
  });
});
