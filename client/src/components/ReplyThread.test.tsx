import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReplyAuthorType } from "@helpdesk/core";
import type { TicketReply } from "@helpdesk/core";
import ReplyThread from "./ReplyThread";

const CUSTOMER_NAME = "Jane Doe";

const agentReply: TicketReply = {
  id: 1,
  body: "Agent reply body",
  authorType: ReplyAuthorType.AGENT,
  author: { id: "agent-1", name: "Bob Agent" },
  createdAt: "2024-01-15T11:00:00.000Z",
};

const customerReply: TicketReply = {
  id: 2,
  body: "Customer reply body",
  authorType: ReplyAuthorType.CUSTOMER,
  author: null,
  createdAt: "2024-01-15T12:00:00.000Z",
};

describe("ReplyThread", () => {
  it("renders nothing when there are no replies", () => {
    const { container } = render(
      <ReplyThread replies={[]} customerName={CUSTOMER_NAME} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows '1 reply' for a single reply", () => {
    render(
      <ReplyThread replies={[agentReply]} customerName={CUSTOMER_NAME} />
    );

    expect(screen.getByText("1 reply")).toBeInTheDocument();
  });

  it("shows 'N replies' for multiple replies", () => {
    render(
      <ReplyThread
        replies={[agentReply, customerReply]}
        customerName={CUSTOMER_NAME}
      />
    );

    expect(screen.getByText("2 replies")).toBeInTheDocument();
  });

  it("renders the body of each reply", () => {
    render(
      <ReplyThread
        replies={[agentReply, customerReply]}
        customerName={CUSTOMER_NAME}
      />
    );

    expect(screen.getByText("Agent reply body")).toBeInTheDocument();
    expect(screen.getByText("Customer reply body")).toBeInTheDocument();
  });

  it("shows the agent name for an AGENT reply", () => {
    render(
      <ReplyThread replies={[agentReply]} customerName={CUSTOMER_NAME} />
    );

    expect(screen.getByText("Bob Agent")).toBeInTheDocument();
  });

  it("shows the customer name for a CUSTOMER reply", () => {
    render(
      <ReplyThread replies={[customerReply]} customerName={CUSTOMER_NAME} />
    );

    expect(screen.getByText(CUSTOMER_NAME)).toBeInTheDocument();
  });

  it("renders the formatted timestamp for each reply", () => {
    render(
      <ReplyThread replies={[agentReply]} customerName={CUSTOMER_NAME} />
    );

    expect(
      screen.getByText(new Date(agentReply.createdAt).toLocaleString())
    ).toBeInTheDocument();
  });
});
