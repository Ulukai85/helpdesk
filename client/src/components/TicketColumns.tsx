import { createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router';
import { type Ticket, TicketCategory, TicketStatus } from '@helpdesk/core';
import { Badge } from '@/components/ui/badge';
import StatusIndicator from '@/components/StatusIndicator';

export const STATUS_LABEL: Record<TicketStatus, string> = {
  [TicketStatus.NEW]: 'New',
  [TicketStatus.PROCESSING]: 'Processing',
  [TicketStatus.OPEN]: 'Open',
  [TicketStatus.RESOLVED]: 'Resolved',
  [TicketStatus.CLOSED]: 'Closed',
};

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  [TicketCategory.GENERAL_QUESTION]: 'General Question',
  [TicketCategory.TECHNICAL_QUESTION]: 'Technical Question',
  [TicketCategory.REFUND_REQUEST]: 'Refund Request',
};

const columnHelper = createColumnHelper<Ticket>();

export const ticketColumns = [
  columnHelper.accessor('subject', {
    header: 'Subject',
    cell: (info) => (
      <Link
        to={`/tickets/${info.row.original.id}`}
        className='font-medium hover:underline'>
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('customerName', {
    header: 'Customer',
    cell: (info) => (
      <div>
        <div>{info.getValue()}</div>
        <div className='text-sm text-muted-foreground'>
          {info.row.original.customerEmail}
        </div>
      </div>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <StatusIndicator
        status={info.getValue()}
        label={STATUS_LABEL[info.getValue()]}
      />
    ),
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    cell: (info) => {
      const category = info.getValue();
      return category ? (
        <Badge variant='outline'>{CATEGORY_LABEL[category]}</Badge>
      ) : (
        <span className='text-muted-foreground'>—</span>
      );
    },
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: (info) => (
      <span className='font-mono text-xs text-muted-foreground'>
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  }),
];
