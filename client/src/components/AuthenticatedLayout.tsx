import { Outlet } from 'react-router';
import Navbar from '@/components/Navbar';

export default function AuthenticatedLayout() {
  return (
    <div className='flex min-h-screen bg-background'>
      <Navbar />
      <main className='min-w-0 flex-1'>
        <Outlet />
      </main>
    </div>
  );
}
