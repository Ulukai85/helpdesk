import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TicketStatus, TicketCategory } from "@helpdesk/core";
import type { TicketDetail } from "@helpdesk/core";
import TicketDetails from "./TicketDetails";

const mockTicket: TicketDetail = {
  id: 1,
  subject: "Broken login",
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
  status: TicketStatus.OPEN,
  category: TicketCategory.TECHNICAL_QUESTION,
  body: "I cannot log in to my account.",
  bodyHtml: null,
  assignedTo: null,
  createdAt: "2024-01-15T10:00:00.000Z",
  updatedAt: "2024-01-15T10:00:00.000Z",
};

describe("TicketDetails", () => {
  it("renders the customer name", () => {
    render(<TicketDetails ticket={mockTicket} />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders the customer email", () => {
    render(<TicketDetails ticket={mockTicket} />);

    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("renders the ticket body", () => {
    render(<TicketDetails ticket={mockTicket} />);

    expect(
      screen.getByText("I cannot log in to my account.")
    ).toBeInTheDocument();
  });
});
