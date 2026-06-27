import TicketsTable from '@/components/TicketsTable';

export default function TicketsPage() {
  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-6'>Tickets</h1>
      <TicketsTable />
    </div>
  );
}
