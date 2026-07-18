import { type TicketReply, ReplyAuthorType } from '@helpdesk/core';

interface Props {
  reply: TicketReply;
  customerName: string;
}

export default function ReplyItem({ reply, customerName }: Props) {
  const authorName =
    reply.authorType === ReplyAuthorType.CUSTOMER
      ? customerName
      : reply.author?.name;

  return (
    <div className='rounded-md border p-4 space-y-1 text-sm'>
      <div className='flex items-center gap-2'>
        <span className='font-medium'>{authorName}</span>
        <span className='text-muted-foreground'>
          {new Date(reply.createdAt).toLocaleString()}
        </span>
      </div>
      <p className='whitespace-pre-wrap'>{reply.body}</p>
    </div>
  );
}
