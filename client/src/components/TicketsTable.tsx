import { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import axios from 'axios';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { type Ticket, TicketStatus, TicketCategory } from '@helpdesk/core';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import TicketFilters from '@/components/TicketFilters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_VARIANT: Record<
  TicketStatus,
  'default' | 'secondary' | 'outline'
> = {
  [TicketStatus.OPEN]: 'default',
  [TicketStatus.RESOLVED]: 'secondary',
  [TicketStatus.CLOSED]: 'outline',
};

const CATEGORY_LABEL: Record<TicketCategory, string> = {
  [TicketCategory.GENERAL_QUESTION]: 'General Question',
  [TicketCategory.TECHNICAL_QUESTION]: 'Technical Question',
  [TicketCategory.REFUND_REQUEST]: 'Refund Request',
};

const columnHelper = createColumnHelper<Ticket>();

const columns = [
  columnHelper.accessor('subject', {
    header: 'Subject',
    cell: (info) => <span className='font-medium'>{info.getValue()}</span>,
  }),
  columnHelper.accessor('customerName', {
    header: 'Customer',
    cell: (info) => (
      <div>
        <div>{info.getValue()}</div>
        <div className='text-sm text-muted-foreground'>
          {info.row.original.customerEmail}
        </div>
      </div>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <Badge variant={STATUS_VARIANT[info.getValue()]}>
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    cell: (info) => {
      const category = info.getValue();
      return category ? CATEGORY_LABEL[category] : '—';
    },
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

export default function TicketsTable() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isPending, error } = useQuery({
    queryKey: ['tickets', { sorting, status, category, search }],
    queryFn: () => {
      const sort = sorting[0];
      return axios
        .get<{ tickets: Ticket[] }>('/api/tickets', {
          params: {
            ...(sort && {
              sortBy: sort.id,
              sortOrder: sort.desc ? 'desc' : 'asc',
            }),
            ...(status !== 'all' && { status }),
            ...(category !== 'all' && { category }),
            ...(search.trim() && { search: search.trim() }),
          },
          withCredentials: true,
        })
        .then((res) => res.data.tickets);
    },
    placeholderData: keepPreviousData,
  });

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableMultiSort: false,
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <div className='space-y-4'>
      <TicketFilters
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        onStatusChange={setStatus}
        category={category}
        onCategoryChange={setCategory}
      />

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.column.getCanSort() ? (
                      <button
                        className='flex items-center gap-1 hover:text-foreground'
                        onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp className='h-3 w-3' />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown className='h-3 w-3' />
                        ) : (
                          <ArrowUpDown className='h-3 w-3 opacity-40' />
                        )}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className='h-4 w-48' /></TableCell>
                  <TableCell><Skeleton className='h-4 w-36' /></TableCell>
                  <TableCell><Skeleton className='h-5 w-16 rounded-full' /></TableCell>
                  <TableCell><Skeleton className='h-4 w-28' /></TableCell>
                  <TableCell><Skeleton className='h-4 w-24' /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='text-center text-destructive py-8'>
                  {error.message}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='text-center text-muted-foreground py-8'>
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
