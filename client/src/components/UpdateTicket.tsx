import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  type TicketDetail,
  type UpdateTicketData,
  type Agent,
  TicketCategory,
  MANUAL_TICKET_STATUSES,
} from '@helpdesk/core';
import TicketSelectField from '@/components/TicketSelectField';
import { CATEGORY_LABEL, STATUS_LABEL } from '@/components/ticketColumns';

const UNASSIGNED = 'unassigned';
const NO_CATEGORY = 'none';

const STATUS_OPTIONS = MANUAL_TICKET_STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABEL[s],
}));

const CATEGORY_OPTIONS = [
  { value: NO_CATEGORY, label: 'Uncategorized' },
  ...Object.values(TicketCategory).map((c) => ({
    value: c,
    label: CATEGORY_LABEL[c],
  })),
];

type Props = {
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
    { value: UNASSIGNED, label: 'Unassigned' },
    ...(agents?.map((a) => ({ value: a.id, label: a.name })) ?? []),
  ];

  return (
    <div className='space-y-3'>
      <TicketSelectField
        label='Status'
        value={ticket.status}
        onValueChange={(val) =>
          update({ status: val as UpdateTicketData['status'] })
        }
        options={STATUS_OPTIONS}
        disabled={isUpdating}
      />
      <TicketSelectField
        label='Category'
        value={ticket.category ?? NO_CATEGORY}
        onValueChange={(val) =>
          update({
            category: val === NO_CATEGORY ? null : (val as TicketCategory),
          })
        }
        options={CATEGORY_OPTIONS}
        disabled={isUpdating}
      />
      <TicketSelectField
        label='Assigned to'
        value={ticket.assignedTo?.id ?? UNASSIGNED}
        onValueChange={(val) =>
          update({ assignedToId: val === UNASSIGNED ? null : val })
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
