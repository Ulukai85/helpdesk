import { screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { Role } from "@helpdesk/core";
import { renderWithRouter } from "@/test/render-with-query";
import Navbar from "./Navbar";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

import { authClient } from "@/lib/auth-client";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Navbar", () => {
  it("shows the Users link for admin users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "1", name: "Admin", email: "a@b.com", role: Role.ADMIN } },
    } as never);

    renderWithRouter(<Navbar />);

    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
  });

  it("hides the Users link for agent users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "2", name: "Agent", email: "b@b.com", role: Role.AGENT } },
    } as never);

    renderWithRouter(<Navbar />);

    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
  });
});
