import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

export type SelectOption = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
};

export default function TicketSelectField({
  label,
  value,
  onValueChange,
  options,
  disabled,
}: Props) {
  const displayLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div>
      <p className='text-sm font-medium mb-1'>{label}</p>
      <Select
        value={value}
        onValueChange={(val) => val !== null && onValueChange(val)}
        disabled={disabled}>
        <SelectTrigger className='w-full' aria-label={label}>
          <span className='flex flex-1 text-left'>{displayLabel}</span>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
