import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { data, isPending } = useQuery({
    queryKey: ['health'],
    queryFn: () => axios.get('/api/health').then((res) => res.data),
  });

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>Helpdesk</h1>
      <div className='flex items-center gap-2'>
        API status:{' '}
        {isPending ? (
          <Skeleton className='h-4 w-16' />
        ) : data?.status === 'ok' ? (
          '✓ ok'
        ) : (
          '✗ unreachable'
        )}
      </div>
    </div>
  );
}
