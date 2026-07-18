import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import axios from "axios";
import ReplyForm from "./ReplyForm";
import { renderWithQuery } from "@/test/render-with-query";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const TICKET_ID = 42;

const renderForm = () => renderWithQuery(<ReplyForm ticketId={TICKET_ID} />);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("ReplyForm", () => {
  it("renders a textarea and submit button", () => {
    renderForm();

    expect(screen.getByPlaceholderText("Write a reply...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reply/i })).toBeInTheDocument();
  });

  describe("Validation", () => {
    it("shows a validation error when submitted empty", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole("button", { name: /send reply/i }));

      await waitFor(() =>
        expect(screen.getByText("Reply cannot be empty")).toBeInTheDocument()
      );
    });

    it("does not show a validation error when the body has content", async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn().mockResolvedValue({});
      renderForm();

      await user.type(screen.getByPlaceholderText("Write a reply..."), "Hello");
      await user.click(screen.getByRole("button", { name: /send reply/i }));

      await waitFor(() => expect(mockedAxios.post).toHaveBeenCalled());
      expect(screen.queryByText("Reply cannot be empty")).not.toBeInTheDocument();
    });
  });

  describe("Submission", () => {
    it("POSTs to the correct endpoint with the reply body", async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn().mockResolvedValue({});
      renderForm();

      await user.type(
        screen.getByPlaceholderText("Write a reply..."),
        "This is my reply"
      );
      await user.click(screen.getByRole("button", { name: /send reply/i }));

      await waitFor(() =>
        expect(mockedAxios.post).toHaveBeenCalledWith(
          `/api/tickets/${TICKET_ID}/replies`,
          { body: "This is my reply" },
          { withCredentials: true }
        )
      );
    });

    it("shows 'Sending…' and disables the button while the request is in flight", async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn(() => new Promise(() => {}));
      renderForm();

      await user.type(screen.getByPlaceholderText("Write a reply..."), "My reply");
      await user.click(screen.getByRole("button", { name: /send reply/i }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled()
      );
    });

    it("clears the textarea after a successful submission", async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn().mockResolvedValue({});
      renderForm();

      await user.type(screen.getByPlaceholderText("Write a reply..."), "My reply");
      await user.click(screen.getByRole("button", { name: /send reply/i }));

      await waitFor(() =>
        expect(screen.getByPlaceholderText("Write a reply...")).toHaveValue("")
      );
    });
  });
});
