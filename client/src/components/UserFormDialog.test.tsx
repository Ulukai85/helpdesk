import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import axios, { AxiosError } from "axios";
import UserFormDialog from "./UserFormDialog";
import { renderWithQuery } from "@/test/render-with-query";
import { Role } from "@helpdesk/core";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const onOpenChange = vi.fn();

const mockUser = {
  id: "user-1",
  name: "Alice Admin",
  email: "alice@example.com",
  role: Role.ADMIN,
  createdAt: "2024-01-15T00:00:00.000Z",
};

const renderCreate = () =>
  renderWithQuery(<UserFormDialog open={true} onOpenChange={onOpenChange} />);

const renderEdit = () =>
  renderWithQuery(
    <UserFormDialog user={mockUser} open={true} onOpenChange={onOpenChange} />
  );

const fillCreateForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Name"), "John Doe");
  await user.type(screen.getByLabelText("Email"), "john@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("UserFormDialog — Create mode", () => {
  it("renders name, email, password fields and action buttons", () => {
    renderCreate();

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^create$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  describe("Validation", () => {
    it("shows errors for all empty fields on submit", async () => {
      const user = userEvent.setup();
      renderCreate();

      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(screen.getByText("Name must be at least 3 characters")).toBeInTheDocument();
        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      });
    });

    it("shows an error when name is fewer than 3 characters", async () => {
      const user = userEvent.setup();
      renderCreate();

      await user.type(screen.getByLabelText("Name"), "ab");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() =>
        expect(screen.getByText("Name must be at least 3 characters")).toBeInTheDocument()
      );
    });

    it("shows an error for an invalid email", async () => {
      const user = userEvent.setup();
      renderCreate();

      await user.type(screen.getByLabelText("Email"), "not-an-email");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() =>
        expect(screen.getByText("Invalid email address")).toBeInTheDocument()
      );
    });

    it("shows an error when password is fewer than 8 characters", async () => {
      const user = userEvent.setup();
      renderCreate();

      await user.type(screen.getByLabelText("Password"), "short");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() =>
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument()
      );
    });
  });

  describe("Submission", () => {
    it("POSTs the form data to /api/users", async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn().mockResolvedValue({});
      renderCreate();

      await fillCreateForm(user);
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() =>
        expect(mockedAxios.post).toHaveBeenCalledWith(
          "/api/users",
          { name: "John Doe", email: "john@example.com", password: "password123" },
          { withCredentials: true }
        )
      );
    });

    it("calls onOpenChange(false) after a successful submission", async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn().mockResolvedValue({});
      renderCreate();

      await fillCreateForm(user);
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it("shows 'Creating...' while the request is in flight", async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn(() => new Promise(() => {}));
      renderCreate();

      await fillCreateForm(user);
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /creating/i })).toBeInTheDocument()
      );
    });

    it("shows the error message returned by the API", async () => {
      const user = userEvent.setup();
      const error = new AxiosError("Request failed");
      error.response = { data: { error: "A user with this email already exists" } } as never;
      mockedAxios.post = vi.fn().mockRejectedValue(error);
      renderCreate();

      await fillCreateForm(user);
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() =>
        expect(
          screen.getByText("A user with this email already exists")
        ).toBeInTheDocument()
      );
    });
  });

  describe("Cancel", () => {
    it("calls onOpenChange(false) when Cancel is clicked", async () => {
      const user = userEvent.setup();
      renderCreate();

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("resets the form when Cancel is clicked", async () => {
      const user = userEvent.setup();
      renderCreate();

      await user.type(screen.getByLabelText("Name"), "John Doe");
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.getByLabelText("Name")).toHaveValue("");
    });
  });
});

describe("UserFormDialog — Edit mode", () => {
  it("renders with pre-populated name and email fields", () => {
    renderEdit();

    expect(screen.getByLabelText("Name")).toHaveValue("Alice Admin");
    expect(screen.getByLabelText("Email")).toHaveValue("alice@example.com");
    expect(screen.getByLabelText(/password/i)).toHaveValue("");
  });

  it("shows 'Edit User' as the dialog title", () => {
    renderEdit();

    expect(screen.getByText("Edit User")).toBeInTheDocument();
  });

  it("shows 'Save' as the submit button label", () => {
    renderEdit();

    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
  });

  it("shows password hint text", () => {
    renderEdit();

    expect(
      screen.getByText("Password (leave blank to keep current)")
    ).toBeInTheDocument();
  });

  describe("Validation", () => {
    it("shows an error when name is fewer than 3 characters", async () => {
      const user = userEvent.setup();
      renderEdit();

      await user.clear(screen.getByLabelText("Name"));
      await user.type(screen.getByLabelText("Name"), "ab");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() =>
        expect(screen.getByText("Name must be at least 3 characters")).toBeInTheDocument()
      );
    });

    it("shows an error for an invalid email", async () => {
      const user = userEvent.setup();
      renderEdit();

      await user.clear(screen.getByLabelText("Email"));
      await user.type(screen.getByLabelText("Email"), "not-an-email");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() =>
        expect(screen.getByText("Invalid email address")).toBeInTheDocument()
      );
    });

    it("shows an error when password is non-empty but fewer than 8 characters", async () => {
      const user = userEvent.setup();
      renderEdit();

      await user.type(screen.getByLabelText(/password/i), "short");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() =>
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument()
      );
    });

    it("does not show a password error when password is left blank", async () => {
      const user = userEvent.setup();
      mockedAxios.patch = vi.fn().mockResolvedValue({});
      renderEdit();

      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() => expect(mockedAxios.patch).toHaveBeenCalled());
      expect(
        screen.queryByText("Password must be at least 8 characters")
      ).not.toBeInTheDocument();
    });
  });

  describe("Submission", () => {
    it("PATCHes the form data to /api/users/:id", async () => {
      const user = userEvent.setup();
      mockedAxios.patch = vi.fn().mockResolvedValue({});
      renderEdit();

      await user.clear(screen.getByLabelText("Name"));
      await user.type(screen.getByLabelText("Name"), "Alice Updated");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() =>
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          "/api/users/user-1",
          { name: "Alice Updated", email: "alice@example.com", password: "" },
          { withCredentials: true }
        )
      );
    });

    it("calls onOpenChange(false) after a successful submission", async () => {
      const user = userEvent.setup();
      mockedAxios.patch = vi.fn().mockResolvedValue({});
      renderEdit();

      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it("shows 'Saving...' while the request is in flight", async () => {
      const user = userEvent.setup();
      mockedAxios.patch = vi.fn(() => new Promise(() => {}));
      renderEdit();

      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument()
      );
    });

    it("shows the error message returned by the API", async () => {
      const user = userEvent.setup();
      const error = new AxiosError("Request failed");
      error.response = { data: { error: "A user with this email already exists" } } as never;
      mockedAxios.patch = vi.fn().mockRejectedValue(error);
      renderEdit();

      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() =>
        expect(
          screen.getByText("A user with this email already exists")
        ).toBeInTheDocument()
      );
    });
  });
});
