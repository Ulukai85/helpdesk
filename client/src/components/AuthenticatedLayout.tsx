import { Outlet } from 'react-router';
import Navbar from '@/components/Navbar';

export default function AuthenticatedLayout() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
