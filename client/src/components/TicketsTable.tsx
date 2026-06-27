import { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type SortingState,
} from '@tanstack/react-table';
import axios from 'axios';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { type Ticket, TicketSortBy, DEFAULT_PAGE_SIZE } from '@helpdesk/core';
import { Skeleton } from '@/components/ui/skeleton';
import TicketFilters from '@/components/TicketFilters';
import TicketPagination from '@/components/TicketPagination';
import { ticketColumns } from '@/components/ticketColumns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function TicketsTable() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: TicketSortBy.CREATED_AT, desc: true },
  ]);
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [status, category, search]);

  const { data, isPending, error } = useQuery({
    queryKey: ['tickets', { sorting, status, category, search, page }],
    queryFn: async () => {
      const sort = sorting[0];
      const { data } = await axios.get<{ tickets: Ticket[]; total: number }>(
        '/api/tickets',
        {
          params: {
            ...(sort && { sortBy: sort.id, sortOrder: sort.desc ? 'desc' : 'asc' }),
            ...(status !== 'all' && { status }),
            ...(category !== 'all' && { category }),
            ...(search.trim() && { search: search.trim() }),
            page,
            pageSize: DEFAULT_PAGE_SIZE,
          },
          withCredentials: true,
        },
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });

  const totalPages = data ? Math.ceil(data.total / DEFAULT_PAGE_SIZE) : 1;

  const table = useReactTable({
    data: data?.tickets ?? [],
    columns: ticketColumns,
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
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp className='h-3 w-3' />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown className='h-3 w-3' />
                        ) : (
                          <ArrowUpDown className='h-3 w-3 opacity-40' />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
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
                <TableCell colSpan={ticketColumns.length} className='text-center text-destructive py-8'>
                  {error.message}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={ticketColumns.length} className='text-center text-muted-foreground py-8'>
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isPending && !error && totalPages > 1 && (
        <TicketPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
