import { z } from "zod";

export enum TicketCategory {
  GENERAL_QUESTION = "GENERAL_QUESTION",
  TECHNICAL_QUESTION = "TECHNICAL_QUESTION",
  REFUND_REQUEST = "REFUND_REQUEST",
}

export enum TicketStatus {
  OPEN = "OPEN",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export type Ticket = {
  id: number;
  subject: string;
  customerName: string;
  customerEmail: string;
  status: TicketStatus;
  category: TicketCategory | null;
  createdAt: string;
};

export const sendgridInboundSchema = z.object({
  from: z.string(),
  subject: z.string(),
  text: z.string().optional().default(""),
  html: z.string().optional().default(""),
});

export type SendgridInboundData = z.infer<typeof sendgridInboundSchema>;
