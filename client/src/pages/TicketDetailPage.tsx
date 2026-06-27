import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type TicketDetail } from '@helpdesk/core';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { STATUS_VARIANT, CATEGORY_LABEL } from '@/components/ticketColumns';

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
        <p className='text-destructive'>{error.message}</p>
      ) : (
        <div className='space-y-6'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-bold'>{data.subject}</h1>
            <p className='text-sm text-muted-foreground'>
              #{data.id} &middot; opened{' '}
              {new Date(data.createdAt).toLocaleString()}
            </p>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Badge variant={STATUS_VARIANT[data.status]}>{data.status}</Badge>
            {data.category && (
              <Badge variant='outline'>{CATEGORY_LABEL[data.category]}</Badge>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='font-medium'>Customer</p>
              <p>{data.customerName}</p>
              <p className='text-muted-foreground'>{data.customerEmail}</p>
            </div>
            {data.assignedTo && (
              <div>
                <p className='font-medium'>Assigned to</p>
                <p>{data.assignedTo.name}</p>
              </div>
            )}
          </div>

          <div className='rounded-md border p-4 whitespace-pre-wrap text-sm'>
            {data.body}
          </div>

          <p className='text-xs text-muted-foreground'>
            Last updated {new Date(data.updatedAt).toLocaleString()}
          </p>
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
      <div className='flex gap-2'>
        <Skeleton className='h-5 w-16 rounded-full' />
        <Skeleton className='h-5 w-24 rounded-full' />
      </div>
      <Skeleton className='h-32 w-full' />
    </div>
  );
}
