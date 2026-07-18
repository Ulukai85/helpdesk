import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { type CreateReplyData, createReplySchema } from '@helpdesk/core';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ErrorMessage from '@/components/ErrorMessage';

type Props = {
  ticketId: number;
}

export default function ReplyForm({ ticketId }: Props) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateReplyData>({
    resolver: zodResolver(createReplySchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateReplyData) =>
      axios.post(`/api/tickets/${ticketId}/replies`, data, {
        withCredentials: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ticket-replies', String(ticketId)],
      });
      reset();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutate(data))}
      className='space-y-2'>
      <Textarea
        placeholder='Write a reply...'
        rows={4}
        {...register('body')}
      />
      <ErrorMessage message={errors.body?.message} />
      <Button type='submit' disabled={isPending}>
        {isPending ? 'Sending…' : 'Send reply'}
      </Button>
    </form>
  );
}
