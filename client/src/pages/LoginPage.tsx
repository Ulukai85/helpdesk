import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { authClient } from '../lib/auth-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ErrorMessage from '@/components/ErrorMessage';

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (session) navigate('/');
  }, [session, navigate]);

  const onSubmit = async (data: FormData) => {
    const { error } = await authClient.signIn.email(data);
    if (error) setError('root', { message: error.message });
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-muted/40'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle className='text-2xl'>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className='space-y-1'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <ErrorMessage message={errors.email?.message} />
            </div>
            <div className='space-y-1'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              <ErrorMessage message={errors.password?.message} />
            </div>
            <ErrorMessage message={errors.root?.message} />
            <Button type='submit' disabled={isSubmitting} className='w-full'>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
