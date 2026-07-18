import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ErrorMessage from '@/components/ErrorMessage';

type Props = {
  ticketId: number;
};

export default function TicketSummary({ ticketId }: Props) {
  const { mutate, data, isPending, error } = useMutation({
    mutationFn: () =>
      axios
        .post<{ summary: string }>(
          `/api/tickets/${ticketId}/summarize`,
          {},
          {
            withCredentials: true,
          },
        )
        .then((res) => res.data.summary),
  });

  return (
    <div className='space-y-3'>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => mutate()}
        disabled={isPending}>
        <Sparkles className='h-4 w-4' />
        {isPending
          ? 'Summarizing…'
          : data
            ? 'Re-generate summary'
            : 'Summarize'}
      </Button>

      {error && <ErrorMessage message={error.message} />}

      {data && (
        <div className='rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground'>
          {data}
        </div>
      )}
    </div>
  );
}
