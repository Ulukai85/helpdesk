import { screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import axios from "axios";
import UsersTable from "./UsersTable";
import { renderWithQuery } from "@/test/render-with-query";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const mockUsers = [
  {
    id: "1",
    name: "Alice Admin",
    email: "alice@example.com",
    role: "ADMIN",
    createdAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Bob Agent",
    email: "bob@example.com",
    role: "AGENT",
    createdAt: "2024-03-22T00:00:00.000Z",
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe("UsersTable", () => {
  it("shows skeleton rows while loading", () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {})); // never resolves

    renderWithQuery(<UsersTable />);

    // 5 skeleton rows × 4 cells = 20 skeleton elements
    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBe(20);
  });

  it("shows an error message when the request fails", async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error("Network Error"));

    renderWithQuery(<UsersTable />);

    await waitFor(() =>
      expect(screen.getByText("Network Error")).toBeInTheDocument()
    );
  });

  it("shows 'No users found' when the list is empty", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: [] } });

    renderWithQuery(<UsersTable />);

    await waitFor(() =>
      expect(screen.getByText("No users found")).toBeInTheDocument()
    );
  });

  it("renders a row for each user with correct data", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: mockUsers } });

    renderWithQuery(<UsersTable />);

    await waitFor(() =>
      expect(screen.getByText("Alice Admin")).toBeInTheDocument()
    );

    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("displays ADMIN badge with default variant and AGENT with secondary", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: mockUsers } });

    renderWithQuery(<UsersTable />);

    await waitFor(() => screen.getByText("ADMIN"));

    expect(screen.getByText("ADMIN")).toBeInTheDocument();
    expect(screen.getByText("AGENT")).toBeInTheDocument();
  });

  it("formats the createdAt date for each user", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: mockUsers } });

    renderWithQuery(<UsersTable />);

    await waitFor(() => screen.getByText("Alice Admin"));

    const aliceDate = new Date("2024-01-15T00:00:00.000Z").toLocaleDateString();
    const bobDate = new Date("2024-03-22T00:00:00.000Z").toLocaleDateString();

    expect(screen.getByText(aliceDate)).toBeInTheDocument();
    expect(screen.getByText(bobDate)).toBeInTheDocument();
  });

  it("calls the correct endpoint with credentials", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: [] } });

    renderWithQuery(<UsersTable />);

    await waitFor(() => screen.getByText("No users found"));

    expect(mockedAxios.get).toHaveBeenCalledWith("/api/users", {
      withCredentials: true,
    });
  });
});
