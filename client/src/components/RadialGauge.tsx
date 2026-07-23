import { cn } from '@/lib/utils';

type Props = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export default function RadialGauge({
  progress,
  size = 48,
  strokeWidth = 5,
  className,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 100);
  const offset = circumference * (1 - clamped / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('-rotate-90', className)}
      role='img'
      aria-hidden='true'>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill='none'
        strokeWidth={strokeWidth}
        className='stroke-lamp-off'
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill='none'
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap='round'
        className='stroke-signal-teal transition-[stroke-dashoffset] duration-700 ease-out'
      />
    </svg>
  );
}
