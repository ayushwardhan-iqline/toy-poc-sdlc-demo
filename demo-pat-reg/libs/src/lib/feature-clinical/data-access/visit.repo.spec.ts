import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { listVisits, type VisitRepoDb } from './visit.repo.js';

/**
 * Instead of module-mocking db.ts (which creates coupling to the import path),
 * we construct a minimal mock db object directly and pass it as the first argument.
 * This is the benefit of the DI refactor — tests are simpler and more explicit.
 */
const makeMockDb = () => ({
  select: vi.fn(),
});

describe('visit.repo', () => {
  // We use any for the fluent chain mocks as Drizzle's types are extremely complex to mock exactly.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let mockDb: ReturnType<typeof makeMockDb>;
  let mockSelectResult: any;
  let mockFromResult: any;
  let mockJoinResult: any;
  let mockWhereResult: any;
  let mockOrderResult: any;
  let mockLimitResult: any;
  let mockOffsetResult: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = makeMockDb();

    mockOffsetResult = {
      then: vi.fn(),
    };
    mockLimitResult = {
      offset: vi.fn().mockReturnValue(mockOffsetResult),
      then: vi.fn(),
    };
    mockOrderResult = {
      limit: vi.fn().mockReturnValue(mockLimitResult),
      then: vi.fn(),
    };
    mockWhereResult = {
      orderBy: vi.fn().mockReturnValue(mockOrderResult),
      then: vi.fn(),
    };
    mockJoinResult = {
      where: vi.fn().mockReturnValue(mockWhereResult),
      then: vi.fn(),
    };
    mockFromResult = {
      innerJoin: vi.fn().mockReturnValue(mockJoinResult),
      where: vi.fn().mockReturnValue(mockWhereResult),
      then: vi.fn(),
    };
    mockSelectResult = {
      from: vi.fn().mockReturnValue(mockFromResult),
    };

    (mockDb.select as Mock).mockReturnValue(mockSelectResult);
  });

  it('should construct correct query for listVisits', async () => {
    const mockRecords = [{ visit: { id: 1 }, patient: { name: 'John' } }];
    const mockCount = [{ count: 1 }];

    mockOffsetResult.then.mockImplementation((callback: any) => Promise.resolve(callback(mockRecords)));
    mockWhereResult.then.mockImplementation((callback: any) => Promise.resolve(callback(mockCount)));

    const result = await listVisits(mockDb as unknown as VisitRepoDb, {
      limit: 10,
      offset: 0,
    });

    expect(mockDb.select).toHaveBeenCalledTimes(2);
    expect(mockSelectResult.from).toHaveBeenCalled();
    expect(mockFromResult.innerJoin).toHaveBeenCalled();
    expect(mockJoinResult.where).toHaveBeenCalledWith(undefined);
    expect(mockLimitResult.offset).toHaveBeenCalledWith(0);
    
    expect(result.records).toEqual(mockRecords);
    expect(result.total).toBe(1);
  });

  it('should apply search filters when provided', async () => {
    mockOffsetResult.then.mockImplementation((callback: any) => Promise.resolve(callback([])));
    mockWhereResult.then.mockImplementation((callback: any) => Promise.resolve(callback([{ count: 0 }])));

    await listVisits(mockDb as unknown as VisitRepoDb, {
      search: 'test',
      limit: 10,
      offset: 0,
    });

    expect(mockJoinResult.where).toHaveBeenCalledWith(expect.anything());
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
});
