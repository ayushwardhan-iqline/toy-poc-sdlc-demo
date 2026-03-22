import { describe, it, expect, vi, afterEach, type Mock } from 'vitest';
import { listRecentVisits } from './list-recent-visits.js';
import { type VisitRepoDb } from '../data-access/visit.repo.js';
import * as VisitRepo from '../data-access/visit.repo.js';

// The use-case is still tested against a mocked repo — the actual db value
// passed through is irrelevant here since listVisits itself is mocked.
vi.mock('../data-access/visit.repo.js');

// A typed null stand-in for the db parameter. Since VisitRepo.listVisits is
// fully mocked at module level, the db value is never actually used.
const mockDb = null as unknown as VisitRepoDb;

describe('listRecentVisits Use Case', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should list and map visits correctly with pagination', async () => {
    // Arrange
    const mockDate = new Date('2026-03-13T10:00:00.000Z');
    const mockRepoResult = {
      records: [
        {
          visit: {
            id: 'visit-1',
            visitNumber: 'VN-123',
            status: 'registered',
            type: 'Consultation',
            patientId: 'patient-1',
            createdAt: mockDate,
            updatedAt: mockDate,
          },
          patient: {
            id: 'patient-1',
            salutation: 'Mr',
            name: 'John Doe',
            gender: 'Male',
            phoneNumber: '1234567890',
            address: '123 Street',
            createdAt: mockDate,
            updatedAt: mockDate,
          },
        },
      ],
      total: 15,
    };

    (VisitRepo.listVisits as Mock).mockResolvedValue(mockRepoResult);

    // Act
    const result = await listRecentVisits(mockDb, { page: 2, pageSize: 10 });

    // Assert
    expect(VisitRepo.listVisits).toHaveBeenCalledWith(mockDb, {
      search: undefined,
      limit: 10,
      offset: 10,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({
      id: 'visit-1',
      visitNumber: 'VN-123',
      patientName: 'John Doe',
      visitDate: '2026-03-13T10:00:00.000Z',
      visitReason: 'Consultation',
      visitStatus: 'registered',
    });

    expect(result.pagination).toEqual({
      total: 15,
      page: 2,
      pageSize: 10,
      totalPages: 2,
    });
  });

  it('should apply defaults for page and pageSize', async () => {
    (VisitRepo.listVisits as Mock).mockResolvedValue({ records: [], total: 0 });

    await listRecentVisits(mockDb, { page: 1, pageSize: 10 });

    expect(VisitRepo.listVisits).toHaveBeenCalledWith(mockDb, {
      search: undefined,
      limit: 10,
      offset: 0,
    });
  });

  it('should pass search term downwards', async () => {
    (VisitRepo.listVisits as Mock).mockResolvedValue({ records: [], total: 0 });

    await listRecentVisits(mockDb, { page: 1, pageSize: 10, search: 'Doe' });

    expect(VisitRepo.listVisits).toHaveBeenCalledWith(mockDb, {
      search: 'Doe',
      limit: 10,
      offset: 0,
    });
  });
});
