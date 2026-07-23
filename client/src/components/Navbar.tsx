import { useNavigate, NavLink, Link } from 'react-router';
import { LayoutDashboard, Inbox, Users, LogOut, Sun, Moon } from 'lucide-react';
import { Role } from '@helpdesk/core';
import { authClient } from '@/lib/auth-client';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-col items-center gap-1 rounded-md px-2 py-2.5 text-[11px] font-medium transition-colors',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
  );

export default function Navbar() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => navigate('/login') },
    });
  };

  const initials = session?.user.name
    ?.split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className='flex w-20 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-4'>
      <Link
        to='/'
        aria-label='Helpdesk home'
        className='mb-6 flex h-9 w-9 items-center justify-center rounded-md bg-primary'>
        <span className='h-2 w-2 rounded-full bg-background' />
      </Link>

      <nav aria-label='Main' className='flex flex-1 flex-col items-center gap-1'>
        <NavLink to='/' end className={navItemClass}>
          <LayoutDashboard className='h-5 w-5' />
          Dashboard
        </NavLink>
        <NavLink to='/tickets' className={navItemClass}>
          <Inbox className='h-5 w-5' />
          Tickets
        </NavLink>
        {session?.user.role === Role.ADMIN && (
          <NavLink to='/users' className={navItemClass}>
            <Users className='h-5 w-5' />
            Users
          </NavLink>
        )}
      </nav>

      <div className='flex flex-col items-center gap-2 border-t border-sidebar-border pt-4'>
        <div
          title={session?.user.name}
          className='flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-medium text-secondary-foreground'>
          {initials}
        </div>
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className='flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground'>
          {theme === 'dark' ? (
            <Sun className='h-4 w-4' />
          ) : (
            <Moon className='h-4 w-4' />
          )}
        </button>
        <button
          onClick={handleSignOut}
          aria-label='Sign out'
          title='Sign out'
          className='flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive'>
          <LogOut className='h-4 w-4' />
        </button>
      </div>
    </aside>
  );
}
