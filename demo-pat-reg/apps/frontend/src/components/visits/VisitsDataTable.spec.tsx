import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VisitsDataTable } from './VisitsDataTable';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as getVisitsModule from '@/features/clinical/api/get-visits';

vi.mock('@/features/clinical/api/get-visits');

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
  );
}

describe('VisitsDataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders loading state initially', () => {
    (getVisitsModule.getVisits as Mock).mockResolvedValueOnce({
      data: [], pagination: { totalPages: 1 }
    });
    
    renderWithClient(<VisitsDataTable />);
    
    expect(screen.getByText('Loading visits...')).toBeInTheDocument();
  });

  it('renders data correctly', async () => {
    const mockData = {
      data: [
        { id: '1', patientName: 'John Doe', visitDate: '2023-10-01T10:00:00Z', visitReason: 'Fever', visitStatus: 'completed' },
      ],
      pagination: { totalPages: 1 }
    };

    (getVisitsModule.getVisits as Mock).mockResolvedValueOnce(mockData);

    renderWithClient(<VisitsDataTable />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Fever')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  it('handles empty state', async () => {
    (getVisitsModule.getVisits as Mock).mockResolvedValueOnce({
      data: [], pagination: { totalPages: 1 }
    });

    renderWithClient(<VisitsDataTable />);

    await waitFor(() => {
      expect(screen.getByText('No recent visits found.')).toBeInTheDocument();
    });
  });

  it('supports pagination controls', async () => {
    (getVisitsModule.getVisits as Mock)
      .mockResolvedValueOnce({
        data: [
          { id: '1', patientName: 'John Doe', visitDate: '2023-10-01T10:00:00Z', visitReason: 'Fever', visitStatus: 'completed' },
        ],
        pagination: { totalPages: 2 }
      })
      .mockResolvedValueOnce({
        data: [
          { id: '2', patientName: 'Jane Roe', visitDate: '2023-10-02T10:00:00Z', visitReason: 'Follow-up', visitStatus: 'in-progress' },
        ],
        pagination: { totalPages: 2 }
      })
      .mockResolvedValueOnce({
        data: [
          { id: '1', patientName: 'John Doe', visitDate: '2023-10-01T10:00:00Z', visitReason: 'Fever', visitStatus: 'completed' },
        ],
        pagination: { totalPages: 2 }
      });

    renderWithClient(<VisitsDataTable />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Go to next page'));

    await waitFor(() => {
      expect(getVisitsModule.getVisits).toHaveBeenLastCalledWith({ page: 2, search: '', pageSize: 10 });
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
      expect(screen.getByText('Jane Roe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Go to previous page'));

    await waitFor(() => {
      expect(getVisitsModule.getVisits).toHaveBeenLastCalledWith({ page: 1, search: '', pageSize: 10 });
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });
  });

  it('debounces search and resets pagination to the first page', async () => {
    (getVisitsModule.getVisits as Mock)
      .mockResolvedValueOnce({
        data: [
          { id: '1', patientName: 'John Doe', visitDate: '2023-10-01T10:00:00Z', visitReason: 'Fever', visitStatus: 'completed' },
        ],
        pagination: { totalPages: 2 }
      })
      .mockResolvedValueOnce({
        data: [
          { id: '2', patientName: 'Jane Roe', visitDate: '2023-10-02T10:00:00Z', visitReason: 'Follow-up', visitStatus: 'in-progress' },
        ],
        pagination: { totalPages: 2 }
      })
      .mockResolvedValueOnce({
        data: [],
        pagination: { totalPages: 1 }
      });

    renderWithClient(<VisitsDataTable />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Go to next page'));

    await waitFor(() => {
      expect(getVisitsModule.getVisits).toHaveBeenLastCalledWith({ page: 2, search: '', pageSize: 10 });
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search visits...'), { target: { value: 'zzz' } });
    // Debounce is 300ms in VisitsDataTable; advance real clock so React Query is not starved
    // (Vitest fake timers prevent useQuery from settling in this environment).
    await act(
      async () =>
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 350);
        })
    );

    await waitFor(() => {
      expect(getVisitsModule.getVisits).toHaveBeenLastCalledWith({ page: 1, search: 'zzz', pageSize: 10 });
      expect(screen.getByText('No visits match your search.')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('Go to next page')).not.toBeInTheDocument();
  });
});
