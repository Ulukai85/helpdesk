import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  message: string | undefined;
}

export default function ErrorMessage({ message }: Props) {
  if (!message) return null;

  return (
    <Alert variant='destructive'>
      <AlertCircle />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
