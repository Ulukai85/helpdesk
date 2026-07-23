import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import RadialGauge from '@/components/RadialGauge';
import { cn } from '@/lib/utils';

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';

  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return `${Math.max(1, Math.round(ms / 60000))}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className='relative overflow-hidden'>
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-0.5',
          accent ? 'bg-signal-teal' : 'bg-primary',
        )}
      />
      <CardHeader>
        <CardTitle className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className='font-mono text-3xl font-semibold'>{value}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardStats() {
  const { data, isPending, error } = useDashboardStats();

  if (error) {
    return (
      <p className='text-sm text-destructive'>Failed to load dashboard stats.</p>
    );
  }

  if (isPending) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className='h-4 w-24' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-16' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const aiPercentageLabel = `${data.aiResolvedPercentage.toFixed(1)}%`;

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
      <StatTile
        label='Total Tickets'
        value={data.totalTickets.toLocaleString()}
      />
      <StatTile label='Open Tickets' value={data.openTickets.toLocaleString()} />
      <StatTile
        label='Resolved by AI'
        value={data.aiResolvedTickets.toLocaleString()}
        accent
      />
      <Card className='relative overflow-hidden'>
        <div className='absolute inset-x-0 top-0 h-0.5 bg-signal-teal' />
        <CardHeader>
          <CardTitle className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
            AI Resolution Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='relative flex w-fit items-center justify-center'>
            <RadialGauge progress={data.aiResolvedPercentage} />
            <span className='absolute font-mono text-xs font-semibold'>
              {aiPercentageLabel}
            </span>
          </div>
        </CardContent>
      </Card>
      <StatTile
        label='Avg. Resolution Time'
        value={formatDuration(data.averageResolutionTimeMs)}
      />
    </div>
  );
}
