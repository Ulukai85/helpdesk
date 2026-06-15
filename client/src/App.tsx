import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Outlet,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Link,
} from 'react-router';
import { authClient } from './lib/auth-client';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';

function Navbar() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => navigate('/login') },
    });
  };

  return (
    <header className='border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between'>
      <div className='flex items-center gap-6'>
        <Link to='/' className='font-semibold text-gray-900'>
          Helpdesk
        </Link>
        {session?.user.role === 'ADMIN' && (
          <Link
            to='/users'
            className='text-sm text-gray-600 hover:text-gray-900'>
            Users
          </Link>
        )}
      </div>
      <div className='flex items-center gap-4'>
        <span className='text-sm text-gray-600'>{session?.user.name}</span>
        <button
          onClick={handleSignOut}
          className='text-sm text-blue-600 hover:underline'>
          Sign out
        </button>
      </div>
    </header>
  );
}

function AuthenticatedLayout() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function HomePage() {
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

export default function App() {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path='/' element={<HomePage />} />
          <Route element={<AdminRoute />}>
            <Route path='/users' element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
