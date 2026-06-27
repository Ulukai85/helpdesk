import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type Ticket, TicketStatus, TicketCategory } from '@helpdesk/core';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_VARIANT: Record<
  TicketStatus,
  'default' | 'secondary' | 'outline'
> = {
  [TicketStatus.OPEN]: 'default',
  [TicketStatus.RESOLVED]: 'secondary',
  [TicketStatus.CLOSED]: 'outline',
};

const CATEGORY_LABEL: Record<TicketCategory, string> = {
  [TicketCategory.GENERAL_QUESTION]: 'General Question',
  [TicketCategory.TECHNICAL_QUESTION]: 'Technical Question',
  [TicketCategory.REFUND_REQUEST]: 'Refund Request',
};

export default function TicketsTable() {
  const { data, isPending, error } = useQuery({
    queryKey: ['tickets'],
    queryFn: () =>
      axios
        .get<{ tickets: Ticket[] }>('/api/tickets', { withCredentials: true })
        .then((res) => res.data.tickets),
  });

  if (isPending) {
    return (
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className='h-4 w-48' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-36' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-5 w-16 rounded-full' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-28' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-24' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return <p className='text-destructive'>{error.message}</p>;
  }

  const tickets = data ?? [];

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className='text-center text-muted-foreground py-8'>
                No tickets yet
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className='font-medium'>{ticket.subject}</TableCell>
                <TableCell>
                  <div>{ticket.customerName}</div>
                  <div className='text-sm text-muted-foreground'>
                    {ticket.customerEmail}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[ticket.status]}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {ticket.category ? CATEGORY_LABEL[ticket.category] : '—'}
                </TableCell>
                <TableCell>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
