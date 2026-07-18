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

export const DEFAULT_PAGE_SIZE = 10;

export const ticketQuerySchema = z.object({
  sortBy: z
    .enum([
      TicketSortBy.SUBJECT,
      TicketSortBy.CUSTOMER_NAME,
      TicketSortBy.STATUS,
      TicketSortBy.CATEGORY,
      TicketSortBy.CREATED_AT,
    ])
    .optional()
    .default(TicketSortBy.CREATED_AT),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z
    .enum([TicketStatus.OPEN, TicketStatus.RESOLVED, TicketStatus.CLOSED])
    .optional(),
  category: z
    .enum([
      TicketCategory.GENERAL_QUESTION,
      TicketCategory.TECHNICAL_QUESTION,
      TicketCategory.REFUND_REQUEST,
      'NONE',
    ])
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
  assignedToId: z.string().nullable(),
});

export type UpdateTicketData = z.infer<typeof updateTicketSchema>;

export const sendgridInboundSchema = z.object({
  from: z.string(),
  subject: z.string(),
  text: z.string().optional().default(''),
  html: z.string().optional().default(''),
});

export type SendgridInboundData = z.infer<typeof sendgridInboundSchema>;
