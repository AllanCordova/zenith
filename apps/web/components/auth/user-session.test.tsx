import { UserSession } from "./user-session";
import { renderWithProviders } from "@/test/render";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getMe, logout } from "@/lib/api/auth";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/api/auth", () => ({
  getMe: jest.fn(),
  logout: jest.fn(),
}));

const mockedGetMe = getMe as jest.MockedFunction<typeof getMe>;
const mockedLogout = logout as jest.MockedFunction<typeof logout>;

describe("UserSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetMe.mockResolvedValue({
      id: "1",
      name: "Ana",
      email: "ana@zenith.test",
      role: "CLIENT",
      createdAt: "2026-01-15T12:00:00.000Z",
    });
    mockedLogout.mockResolvedValue(undefined);
  });

  it("greets the current user and can log out", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserSession />);
    expect(await screen.findByText("Olá, Ana")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /sair/i }));
    expect(mockedLogout).toHaveBeenCalled();
  });
});
