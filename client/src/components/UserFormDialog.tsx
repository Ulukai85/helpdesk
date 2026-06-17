import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import {
  createUserSchema,
  editUserSchema,
  type User,
  type CreateUserData,
  type EditUserData,
  type UserFormData,
} from '@helpdesk/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserFormDialog({ user, open, onOpenChange }: Props) {
  const isEditing = !!user;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(isEditing ? editUserSchema : createUserSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateUserData | EditUserData) =>
      isEditing
        ? axios.patch(`/api/users/${user.id}`, data, { withCredentials: true })
        : axios.post('/api/users', data, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
      mutation.reset();
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = (data: UserFormData) => mutation.mutate(data);

  const errorMessage =
    mutation.error instanceof AxiosError
      ? (mutation.error.response?.data?.error ?? mutation.error.message)
      : mutation.error?.message;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Create User'}</DialogTitle>
        </DialogHeader>
        <form
          id='user-form'
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-4'
          noValidate>
          <div className='space-y-1.5'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className='text-sm text-destructive'>{errors.name.message}</p>
            )}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              autoComplete='off'
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className='text-sm text-destructive'>{errors.email.message}</p>
            )}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='password'>
              {isEditing
                ? 'Password (leave blank to keep current)'
                : 'Password'}
            </Label>
            <Input
              id='password'
              type='password'
              autoComplete='new-password'
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className='text-sm text-destructive'>
                {errors.password.message}
              </p>
            )}
          </div>
          {errorMessage && (
            <p className='text-sm text-destructive'>{errorMessage}</p>
          )}
        </form>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='user-form' disabled={mutation.isPending}>
            {mutation.isPending
              ? isEditing
                ? 'Saving...'
                : 'Creating...'
              : isEditing
                ? 'Save'
                : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
