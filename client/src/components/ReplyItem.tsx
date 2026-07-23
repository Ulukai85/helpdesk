import { type TicketReply, ReplyAuthorType } from '@helpdesk/core';
import { cn } from '@/lib/utils';

type Props = {
  reply: TicketReply;
  customerName: string;
};

export default function ReplyItem({ reply, customerName }: Props) {
  const isAi = reply.authorType === ReplyAuthorType.AI;
  const authorName = isAi
    ? 'AI Assistant'
    : reply.authorType === ReplyAuthorType.CUSTOMER
      ? customerName
      : reply.author?.name;

  return (
    <div
      className={cn(
        'rounded-md border p-4 space-y-1 text-sm',
        isAi && 'border-l-2 border-l-signal-teal',
      )}>
      <div className='flex items-center gap-2'>
        <span className={cn('font-medium', isAi && 'text-signal-teal')}>
          {authorName}
        </span>
        <span className='font-mono text-xs text-muted-foreground'>
          {new Date(reply.createdAt).toLocaleString()}
        </span>
      </div>
      <p className='whitespace-pre-wrap'>{reply.body}</p>
    </div>
  );
}
