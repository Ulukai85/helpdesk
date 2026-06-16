import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import axios, { AxiosError } from "axios";
import CreateUserDialog from "./CreateUserDialog";
import { renderWithQuery } from "@/test/render-with-query";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const onOpenChange = vi.fn();

const renderDialog = () =>
  renderWithQuery(<CreateUserDialog open={true} onOpenChange={onOpenChange} />);

const fillForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Name"), "John Doe");
  await user.type(screen.getByLabelText("Email"), "john@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("CreateUserDialog", () => {
  it("renders name, email, password fields and action buttons", () => {
    renderDialog();

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^create$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  describe("Validation", () => {
    it("shows errors for all empty fields on submit", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(screen.getByText("Name must be at least 3 characters")).toBeInTheDocument();
        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      });
    });

    it("shows an error when name is fewer than 3 characters", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.type(screen.getByLabelText("Name"), "ab");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() =>
        expect(screen.getByText("Name must be at least 3 characters")).toBeInTheDocument()
      );
    });

    it("shows an error for an invalid email", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.type(screen.getByLabelText("Email"), "not-an-email");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() =>
        expect(screen.getByText("Invalid email address")).toBeInTheDocument()
      );
    });

    it("shows an error when password is fewer than 8 characters", async () => {
      const user = userEvent.setup();
      renderDialog();

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
      renderDialog();

      await fillForm(user);
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
      renderDialog();

      await fillForm(user);
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it("shows 'Creating...' while the request is in flight", async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn(() => new Promise(() => {}));
      renderDialog();

      await fillForm(user);
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
      renderDialog();

      await fillForm(user);
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
      renderDialog();

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("resets the form when Cancel is clicked", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.type(screen.getByLabelText("Name"), "John Doe");
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.getByLabelText("Name")).toHaveValue("");
    });
  });
});
