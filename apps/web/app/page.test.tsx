import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renderiza fallback de redirecionamento", () => {
    render(<Home />);
    expect(screen.getByText(/redirecionando/i)).toBeInTheDocument();
  });
});
