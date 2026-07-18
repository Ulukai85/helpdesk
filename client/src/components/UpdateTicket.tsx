import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  type TicketDetail,
  type UpdateTicketData,
  TicketStatus,
  TicketCategory,
} from '@helpdesk/core';
import TicketSelectField from '@/components/TicketSelectField';
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

interface Props {
  ticket: TicketDetail;
  agents: Agent[] | undefined;
}

export default function UpdateTicket({ ticket, agents }: Props) {
  const queryClient = useQueryClient();

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: (patch: UpdateTicketData) =>
      axios.patch(`/api/tickets/${ticket.id}`, patch, { withCredentials: true }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['ticket', String(ticket.id)] }),
  });

  const agentOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...(agents?.map((a) => ({ value: a.id, label: a.name })) ?? []),
  ];

  return (
    <div className='space-y-3'>
      <TicketSelectField
        label='Status'
        value={ticket.status}
        onValueChange={(val) => update({ status: val as TicketStatus })}
        options={STATUS_OPTIONS}
        disabled={isUpdating}
      />
      <TicketSelectField
        label='Category'
        value={ticket.category ?? 'none'}
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
        value={ticket.assignedTo?.id ?? 'unassigned'}
        onValueChange={(val) =>
          update({ assignedToId: val === 'unassigned' ? null : val })
        }
        options={agentOptions}
        disabled={isUpdating || !agents}
      />
      <p className='text-xs text-muted-foreground pt-2'>
        Last updated {new Date(ticket.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
