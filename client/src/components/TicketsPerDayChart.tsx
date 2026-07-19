import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const chartConfig = {
  count: { label: 'Tickets', color: 'var(--primary)' },
} satisfies ChartConfig;

function formatTickDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function TicketsPerDayChart() {
  const { data, isPending, error } = useDashboardStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tickets per Day</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className='text-sm text-destructive'>Failed to load chart data.</p>
        ) : isPending ? (
          <Skeleton className='aspect-video w-full' />
        ) : (
          <ChartContainer config={chartConfig} className='w-full'>
            <BarChart data={data.ticketsPerDay}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={4}
                tickFormatter={formatTickDate}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={24}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatTickDate(String(value))}
                  />
                }
              />
              <Bar
                dataKey='count'
                fill='var(--color-count)'
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
