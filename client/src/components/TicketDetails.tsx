import { type TicketDetail } from '@helpdesk/core';

type Props = {
  ticket: TicketDetail;
}

export default function TicketDetails({ ticket }: Props) {
  return (
    <>
      <div className='text-sm space-y-0.5'>
        <p className='font-medium'>Customer</p>
        <p>{ticket.customerName}</p>
        <p className='text-muted-foreground'>{ticket.customerEmail}</p>
      </div>

      <div className='rounded-md border p-4 whitespace-pre-wrap text-sm'>
        {ticket.body}
      </div>
    </>
  );
}
