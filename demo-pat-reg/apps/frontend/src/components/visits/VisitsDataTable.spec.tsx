import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
});
