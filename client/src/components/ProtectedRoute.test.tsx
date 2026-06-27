import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ProtectedRoute from "./ProtectedRoute";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

import { authClient } from "@/lib/auth-client";

const renderProtectedRoute = (initialEntry = "/") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/users" element={<div>Users Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.resetAllMocks();
});

describe("ProtectedRoute", () => {
  it("redirects to /login when visiting / without a session", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as never);

    renderProtectedRoute("/");

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Home Page")).not.toBeInTheDocument();
  });

  it("redirects to /login when visiting /users without a session", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as never);

    renderProtectedRoute("/users");

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Users Page")).not.toBeInTheDocument();
  });

  it("renders the outlet when a session exists", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "1", name: "Admin", email: "a@b.com", role: "ADMIN" } },
      isPending: false,
    } as never);

    renderProtectedRoute("/");

    expect(screen.getByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});
