import type { DashboardStats as DashboardStatsData } from '@helpdesk/core';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';

  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return `${Math.max(1, Math.round(ms / 60000))}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

type Stat = { label: string; value: string };

function statsToTiles(stats: DashboardStatsData): Stat[] {
  return [
    { label: 'Total Tickets', value: stats.totalTickets.toLocaleString() },
    { label: 'Open Tickets', value: stats.openTickets.toLocaleString() },
    {
      label: 'Resolved by AI',
      value: stats.aiResolvedTickets.toLocaleString(),
    },
    {
      label: 'AI Resolution Rate',
      value: `${stats.aiResolvedPercentage.toFixed(1)}%`,
    },
    {
      label: 'Avg. Resolution Time',
      value: formatDuration(stats.averageResolutionTimeMs),
    },
  ];
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

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
      {statsToTiles(data).map((tile) => (
        <Card key={tile.label}>
          <CardHeader>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              {tile.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>{tile.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
