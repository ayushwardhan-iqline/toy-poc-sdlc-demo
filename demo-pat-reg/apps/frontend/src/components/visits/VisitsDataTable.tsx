import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVisits } from '@/features/clinical/api/get-visits';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export function VisitsDataTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['visits', page, debouncedSearch],
    queryFn: () => getVisits({ page, search: debouncedSearch, pageSize: 10 })
  });

  const data = responseData?.data || [];
  const totalPages = responseData?.pagination?.totalPages || 1;

  let tableContent = null;
  if (isLoading) {
    tableContent = (
      <TableRow>
        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm">
          <div className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block"></span>
            Loading visits...
          </div>
        </TableCell>
      </TableRow>
    );
  } else if (data.length === 0) {
    tableContent = (
      <TableRow>
        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm">
          {debouncedSearch ? 'No visits match your search.' : 'No recent visits found.'}
        </TableCell>
      </TableRow>
    );
  } else {
    tableContent = data.map((visit) => (
      <TableRow key={visit.id} className="transition-colors hover:bg-muted/50">
        <TableCell className="font-medium text-foreground">{visit.patientName}</TableCell>
        <TableCell className="text-muted-foreground">{new Date(visit.visitDate).toLocaleString()}</TableCell>
        <TableCell className="text-muted-foreground">{visit.visitReason || '-'}</TableCell>
        <TableCell>
          <span className="capitalize inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            {visit.visitStatus.replace('-', ' ')}
          </span>
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-semibold">Recent Visits</h2>
          <p className="text-sm text-muted-foreground">View and search through active patient visits.</p>
        </div>
        <Input
          placeholder="Search visits..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Name</TableHead>
              <TableHead>Visit Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableContent}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(p => p - 1);
                }} 
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            <span className="text-sm font-medium px-4 text-muted-foreground">Page {page} of {totalPages}</span>
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPage(p => p + 1);
                }} 
                className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
