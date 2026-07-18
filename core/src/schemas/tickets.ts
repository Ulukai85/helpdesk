import { z } from 'zod';

export enum TicketCategory {
  GENERAL_QUESTION = 'GENERAL_QUESTION',
  TECHNICAL_QUESTION = 'TECHNICAL_QUESTION',
  REFUND_REQUEST = 'REFUND_REQUEST',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketSortBy {
  SUBJECT = 'subject',
  CUSTOMER_NAME = 'customerName',
  STATUS = 'status',
  CATEGORY = 'category',
  CREATED_AT = 'createdAt',
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

export type TicketDetail = Ticket & {
  body: string;
  bodyHtml: string | null;
  assignedTo: { id: string; name: string } | null;
  updatedAt: string;
};

export enum ReplyAuthorType {
  AGENT = 'AGENT',
  CUSTOMER = 'CUSTOMER',
}

export type TicketReply = {
  id: number;
  body: string;
  authorType: ReplyAuthorType;
  author: { id: string; name: string } | null;
  createdAt: string;
};

export const createReplySchema = z.object({
  body: z.string().min(1, 'Reply cannot be empty'),
});

export type CreateReplyData = z.infer<typeof createReplySchema>;

export const DEFAULT_PAGE_SIZE = 10;

export const ticketQuerySchema = z.object({
  sortBy: z.enum(TicketSortBy).optional().default(TicketSortBy.CREATED_AT),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.enum(TicketStatus).optional(),
  category: z
    .union([z.enum(TicketCategory), z.literal('NONE')])
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(DEFAULT_PAGE_SIZE),
});

export type TicketQueryData = z.infer<typeof ticketQuerySchema>;

export const updateTicketSchema = z.object({
  assignedToId: z.string().nullable().optional(),
  status: z.enum(TicketStatus).optional(),
  category: z.enum(TicketCategory).nullable().optional(),
});

export type UpdateTicketData = z.infer<typeof updateTicketSchema>;

export const sendgridInboundSchema = z.object({
  from: z.string(),
  subject: z.string(),
  text: z.string().optional().default(''),
  html: z.string().optional().default(''),
});

export type SendgridInboundData = z.infer<typeof sendgridInboundSchema>;
