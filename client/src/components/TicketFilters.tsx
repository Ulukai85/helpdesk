import { Search } from 'lucide-react';
import { TicketCategory, TicketStatus } from '@helpdesk/core';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
};

export default function TicketFilters({
  searchInput,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
}: Props) {
  return (
    <div className='flex items-center gap-3'>
      <div className='relative flex-1 max-w-sm'>
        <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Search tickets…'
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-8'
        />
      </div>
      <Select value={status} onValueChange={(v) => onStatusChange(v ?? 'all')}>
        <SelectTrigger className='w-40'>
          <SelectValue placeholder='All statuses' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All statuses</SelectItem>
          <SelectItem value={TicketStatus.OPEN}>Open</SelectItem>
          <SelectItem value={TicketStatus.RESOLVED}>Resolved</SelectItem>
          <SelectItem value={TicketStatus.CLOSED}>Closed</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={category}
        onValueChange={(v) => onCategoryChange(v ?? 'all')}>
        <SelectTrigger className='w-48'>
          <SelectValue placeholder='All categories' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All categories</SelectItem>
          <SelectItem value={TicketCategory.GENERAL_QUESTION}>
            General Question
          </SelectItem>
          <SelectItem value={TicketCategory.TECHNICAL_QUESTION}>
            Technical Question
          </SelectItem>
          <SelectItem value={TicketCategory.REFUND_REQUEST}>
            Refund Request
          </SelectItem>
          <SelectItem value='NONE'>Uncategorised</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
