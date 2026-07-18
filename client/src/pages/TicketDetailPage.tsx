import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  type TicketDetail,
  type UpdateTicketData,
  TicketStatus,
  TicketCategory,
} from '@helpdesk/core';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TicketSelectField from '@/components/TicketSelectField';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { CATEGORY_LABEL } from '@/components/ticketColumns';

type Agent = { id: string; name: string };

const STATUS_OPTIONS = Object.values(TicketStatus).map((s) => ({
  value: s,
  label: s,
}));

const CATEGORY_OPTIONS = [
  { value: 'none', label: 'Uncategorized' },
  ...Object.values(TicketCategory).map((c) => ({
    value: c,
    label: CATEGORY_LABEL[c],
  })),
];

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

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

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: (patch: UpdateTicketData) =>
      axios.patch(`/api/tickets/${id}`, patch, { withCredentials: true }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['ticket', id] }),
  });

  const agentOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...(agents?.map((a) => ({ value: a.id, label: a.name })) ?? []),
  ];

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

          <div className='grid grid-cols-2 gap-4'>
            <div className='text-sm'>
              <p className='font-medium'>Customer</p>
              <p>{data.customerName}</p>
              <p className='text-muted-foreground'>{data.customerEmail}</p>
            </div>

            <div className='space-y-3'>
              <TicketSelectField
                label='Status'
                value={data.status}
                onValueChange={(val) => update({ status: val as TicketStatus })}
                options={STATUS_OPTIONS}
                disabled={isUpdating}
              />
              <TicketSelectField
                label='Category'
                value={data.category ?? 'none'}
                onValueChange={(val) =>
                  update({
                    category: val === 'none' ? null : (val as TicketCategory),
                  })
                }
                options={CATEGORY_OPTIONS}
                disabled={isUpdating}
              />
              <TicketSelectField
                label='Assigned to'
                value={data.assignedTo?.id ?? 'unassigned'}
                onValueChange={(val) =>
                  update({ assignedToId: val === 'unassigned' ? null : val })
                }
                options={agentOptions}
                disabled={isUpdating || !agents}
              />
            </div>
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
      <div className='grid grid-cols-2 gap-4'>
        <Skeleton className='h-12 w-48' />
        <div className='space-y-3'>
          <Skeleton className='h-14 w-full' />
          <Skeleton className='h-14 w-full' />
          <Skeleton className='h-14 w-full' />
        </div>
      </div>
      <Skeleton className='h-32 w-full' />
    </div>
  );
}
