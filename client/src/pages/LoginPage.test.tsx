import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderWithRouter } from "@/test/render-with-query";
import LoginPage from "./LoginPage";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    signIn: { email: vi.fn() },
  },
}));

import { authClient } from "@/lib/auth-client";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(authClient.useSession).mockReturnValue({
    data: null,
    isPending: false,
  } as never);
});

describe("LoginPage", () => {
  it("renders the sign in form with all fields", () => {
    renderWithRouter(<LoginPage />);

    // CardTitle renders as a div, not a heading — query by its data-slot attribute
    expect(document.querySelector('[data-slot="card-title"]')).toHaveTextContent(
      "Sign in",
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows loading state while signing in", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signIn.email).mockReturnValue(new Promise(() => {}));

    renderWithRouter(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      screen.getByRole("button", { name: "Signing in…" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
  });

  describe("Form validation", () => {
    it("shows email error when email field is empty", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      await user.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() =>
        expect(screen.getByText("Enter a valid email")).toBeInTheDocument(),
      );
    });

    it("shows password error when password field is empty", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() =>
        expect(screen.getByText("Password is required")).toBeInTheDocument(),
      );
    });

    it("shows both errors when both fields are empty", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      await user.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => {
        expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
        expect(screen.getByText("Password is required")).toBeInTheDocument();
      });
    });
  });
});
