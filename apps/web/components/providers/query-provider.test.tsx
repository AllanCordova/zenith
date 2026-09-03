import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { QueryProvider } from "./query-provider";

function Probe() {
  const { data } = useQuery({
    queryKey: ["probe"],
    queryFn: () => "ok",
  });
  return <p>{data ?? "loading"}</p>;
}

describe("QueryProvider", () => {
  it("provides a query client to children", async () => {
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );
    expect(await screen.findByText("ok")).toBeInTheDocument();
  });
});
