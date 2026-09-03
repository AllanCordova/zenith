import { render, screen } from "@testing-library/react";
import { TextLink } from "./text-link";

describe("TextLink", () => {
  it("renders a link to the given href", () => {
    render(<TextLink href="/register">Cadastrar</TextLink>);
    expect(screen.getByRole("link", { name: /cadastrar/i })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
