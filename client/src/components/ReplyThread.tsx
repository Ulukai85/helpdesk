import { type TicketReply } from '@helpdesk/core';
import ReplyItem from '@/components/ReplyItem';

interface Props {
  replies: TicketReply[];
  customerName: string;
}

export default function ReplyThread({ replies, customerName }: Props) {
  if (replies.length === 0) return null;

  return (
    <div className='space-y-3'>
      <p className='text-sm font-medium'>
        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
      </p>
      {replies.map((reply) => (
        <ReplyItem key={reply.id} reply={reply} customerName={customerName} />
      ))}
    </div>
  );
}
