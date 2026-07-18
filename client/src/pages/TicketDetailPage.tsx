import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type TicketDetail, type TicketReply, type Agent } from '@helpdesk/core';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorMessage from '@/components/ErrorMessage';
import TicketDetails from '@/components/TicketDetails';
import UpdateTicket from '@/components/UpdateTicket';
import ReplyThread from '@/components/ReplyThread';
import ReplyForm from '@/components/ReplyForm';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isPending, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () =>
      axios
        .get<{ ticket: TicketDetail }>(`/api/tickets/${id}`, {
          withCredentials: true,
        })
        .then((res) => res.data.ticket),
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () =>
      axios
        .get<{ agents: Agent[] }>('/api/agents', { withCredentials: true })
        .then((res) => res.data.agents),
  });

  const { data: replies } = useQuery({
    queryKey: ['ticket-replies', id],
    queryFn: () =>
      axios
        .get<{ replies: TicketReply[] }>(`/api/tickets/${id}/replies`, {
          withCredentials: true,
        })
        .then((res) => res.data.replies),
    enabled: !!id,
  });

  return (
    <div className='p-8 space-y-6'>
      <Link
        to='/tickets'
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
        <ArrowLeft className='h-4 w-4' />
        Back to tickets
      </Link>

      {isPending ? (
        <TicketDetailSkeleton />
      ) : error ? (
        <ErrorMessage message={error.message} />
      ) : (
        <div className='space-y-4'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-bold'>{data.subject}</h1>
            <p className='text-sm text-muted-foreground'>
              #{data.id} &middot; opened{' '}
              {new Date(data.createdAt).toLocaleString()}
            </p>
          </div>

          <div className='grid grid-cols-3 gap-8 items-start'>
            <div className='col-span-2 space-y-6'>
              <TicketDetails ticket={data} />
              <ReplyThread
                replies={replies ?? []}
                customerName={data.customerName}
              />
              <ReplyForm ticketId={data.id} />
            </div>

            <UpdateTicket ticket={data} agents={agents} />
          </div>
        </div>
      )}
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-8 w-96' />
      <Skeleton className='h-4 w-48' />
      <div className='grid grid-cols-3 gap-8'>
        <div className='col-span-2 space-y-4'>
          <Skeleton className='h-12 w-48' />
          <Skeleton className='h-32 w-full' />
        </div>
        <div className='space-y-3'>
          <Skeleton className='h-14 w-full' />
          <Skeleton className='h-14 w-full' />
          <Skeleton className='h-14 w-full' />
        </div>
      </div>
    </div>
  );
}
