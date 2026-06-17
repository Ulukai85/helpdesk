import { useNavigate, Link } from 'react-router';
import { Role } from '@helpdesk/core';
import { authClient } from '@/lib/auth-client';

export default function Navbar() {
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
        {session?.user.role === Role.ADMIN && (
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
