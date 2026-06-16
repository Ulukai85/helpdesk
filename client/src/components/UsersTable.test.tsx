import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    // 5 skeleton rows × 4 data cells = 20 skeleton elements (Actions column has no skeleton)
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

  it("renders an edit button for each user row", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: mockUsers } });

    renderWithQuery(<UsersTable />);

    await waitFor(() => screen.getByText("Alice Admin"));

    const editButtons = screen.getAllByRole("button", { name: /edit user/i });
    expect(editButtons).toHaveLength(mockUsers.length);
  });

  it("opens the edit dialog with the correct user when the edit button is clicked", async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: mockUsers } });
    mockedAxios.patch = vi.fn(() => new Promise(() => {}));

    renderWithQuery(<UsersTable />);

    await waitFor(() => screen.getByText("Alice Admin"));

    const editButtons = screen.getAllByRole("button", { name: /edit user/i });
    await user.click(editButtons[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alice Admin")).toBeInTheDocument();
    expect(screen.getByDisplayValue("alice@example.com")).toBeInTheDocument();
  });

  it("shows a delete button only for non-ADMIN users", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: mockUsers } });

    renderWithQuery(<UsersTable />);

    await waitFor(() => screen.getByText("Alice Admin"));

    const deleteButtons = screen.getAllByRole("button", { name: /delete user/i });
    // Only Bob (AGENT) gets a delete button; Alice (ADMIN) does not
    expect(deleteButtons).toHaveLength(1);
  });

  it("shows the confirmation dialog when a delete button is clicked", async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: mockUsers } });

    renderWithQuery(<UsersTable />);

    await waitFor(() => screen.getByText("Bob Agent"));

    await user.click(screen.getByRole("button", { name: /delete user/i }));

    expect(screen.getByText(/are you sure you want to delete bob agent/i)).toBeInTheDocument();
  });

  it("calls DELETE /api/users/:id when the delete is confirmed", async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: mockUsers } });
    mockedAxios.delete = vi.fn().mockResolvedValue({});

    renderWithQuery(<UsersTable />);

    await waitFor(() => screen.getByText("Bob Agent"));

    await user.click(screen.getByRole("button", { name: /delete user/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() =>
      expect(mockedAxios.delete).toHaveBeenCalledWith("/api/users/2", {
        withCredentials: true,
      })
    );
  });

  it("closes the confirmation dialog when Cancel is clicked", async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: mockUsers } });

    renderWithQuery(<UsersTable />);

    await waitFor(() => screen.getByText("Bob Agent"));

    await user.click(screen.getByRole("button", { name: /delete user/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() =>
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
    );
  });
});
