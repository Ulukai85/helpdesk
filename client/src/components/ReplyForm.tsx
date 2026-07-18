import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { type CreateReplyData, createReplySchema } from '@helpdesk/core';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ErrorMessage from '@/components/ErrorMessage';
import { Wand2 } from 'lucide-react';

type Props = {
  ticketId: number;
};

export default function ReplyForm({ ticketId }: Props) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CreateReplyData>({
    resolver: zodResolver(createReplySchema),
  });

  const { mutate: sendReply, isPending: isSending } = useMutation({
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

  const { mutate: polishReply, isPending: isPolishing } = useMutation({
    mutationFn: (data: CreateReplyData) =>
      axios
        .post<{ body: string }>(`/api/tickets/${ticketId}/polish-reply`, data, {
          withCredentials: true,
        })
        .then((res) => res.data.body),
    onSuccess: (polishedBody) => {
      setValue('body', polishedBody, { shouldValidate: true });
    },
  });

  const handlePolish = () => {
    const body = getValues('body');
    polishReply({ body });
  };

  return (
    <form
      onSubmit={handleSubmit((data) => sendReply(data))}
      className='space-y-2'>
      <Textarea placeholder='Write a reply...' rows={4} {...register('body')} />
      <ErrorMessage message={errors.body?.message} />
      <div className='flex gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={handlePolish}
          disabled={isPolishing || isSending}>
          <Wand2 className='h-4 w-4' />
          {isPolishing ? 'Polishing…' : 'Polish'}
        </Button>
        <Button type='submit' disabled={isSending || isPolishing}>
          {isSending ? 'Sending…' : 'Send reply'}
        </Button>
      </div>
    </form>
  );
}
