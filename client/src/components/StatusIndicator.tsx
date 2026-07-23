import { TicketStatus } from '@helpdesk/core';
import { cn } from '@/lib/utils';

const PIPELINE = [
  TicketStatus.OPEN,
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED,
];

type Props = {
  status: TicketStatus;
  label: string;
  className?: string;
};

export default function StatusIndicator({ status, label, className }: Props) {
  const stageIndex = PIPELINE.indexOf(status);
  const archived = status === TicketStatus.CLOSED;

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div className='flex items-center gap-0.5' aria-hidden='true'>
        {PIPELINE.map((stage, i) => {
          const lit = i <= stageIndex;
          const isCurrent = i === stageIndex;
          return (
            <span
              key={stage}
              className={cn(
                'h-1.5 w-3 rounded-full transition-colors',
                lit
                  ? archived
                    ? 'bg-muted-foreground/50'
                    : 'bg-primary'
                  : 'bg-lamp-off',
                isCurrent && !archived && 'motion-safe:animate-pulse',
              )}
            />
          );
        })}
      </div>
      <span className='text-xs font-medium whitespace-nowrap'>{label}</span>
    </div>
  );
}
