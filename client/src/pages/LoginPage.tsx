import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { authClient } from '../lib/auth-client';

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await authClient.signIn.email(data, {
      onSuccess: () => navigate('/'),
      onError: (ctx) =>
        setError('root', { message: ctx.error.message }),
    });
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='w-full max-w-sm bg-white rounded-2xl shadow p-8'>
        <h1 className='text-2xl font-bold mb-6 text-gray-900'>Sign in</h1>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Email
            </label>
            <input
              type='email'
              {...register('email')}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
            />
            {errors.email && (
              <p className='mt-1 text-xs text-red-600'>{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Password
            </label>
            <input
              type='password'
              {...register('password')}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
            />
            {errors.password && (
              <p className='mt-1 text-xs text-red-600'>{errors.password.message}</p>
            )}
          </div>
          {errors.root && (
            <p className='text-sm text-red-600'>{errors.root.message}</p>
          )}
          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors'>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
