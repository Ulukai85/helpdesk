import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export default function ErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Try reloading the page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetError}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
