import DashboardStats from '@/components/DashboardStats';
import TicketsPerDayChart from '@/components/TicketsPerDayChart';

export default function HomePage() {
  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-6'>Dashboard</h1>
      <DashboardStats />
      <div className='mt-6'>
        <TicketsPerDayChart />
      </div>
    </div>
  );
}
