import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';
import { handleListVisits } from './visit.handlers.js';
import * as ListRecentVisitsUseCase from '../use-cases/list-recent-visits.js';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Mock the use case
vi.mock('../use-cases/list-recent-visits.js', () => ({
  listRecentVisits: vi.fn(),
}));

// Mock the db import so no real Postgres connection is made
vi.mock('../../backend/db.js', () => ({
  db: {},
}));

describe('visit.handlers', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: MockInstance;
  let mockStatus: MockInstance;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockNext = vi.fn() as unknown as NextFunction;
    mockReq = { query: {} };
    mockRes = {
      json: mockJson as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      status: mockStatus as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    vi.clearAllMocks();
  });

  describe('handleListVisits', () => {
    it('should successfully list visits with valid query params', async () => {
      mockReq.query = { page: '1', pageSize: '10' };
      const mockResult = {
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 }
      };
      vi.mocked(ListRecentVisitsUseCase.listRecentVisits).mockResolvedValue(mockResult);

      await handleListVisits(mockReq as Request, mockRes as Response, mockNext);

      expect(ListRecentVisitsUseCase.listRecentVisits).toHaveBeenCalledWith(expect.anything(), { page: 1, pageSize: 10 });
      expect(mockJson).toHaveBeenCalledWith(mockResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should successfully list visits with default query params if none provided', async () => {
      mockReq.query = {};
      const mockResult = {
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 }
      };
      vi.mocked(ListRecentVisitsUseCase.listRecentVisits).mockResolvedValue(mockResult);

      await handleListVisits(mockReq as Request, mockRes as Response, mockNext);

      expect(ListRecentVisitsUseCase.listRecentVisits).toHaveBeenCalledWith(expect.anything(), { page: 1, pageSize: 10 });
      expect(mockJson).toHaveBeenCalledWith(mockResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() with a ZodError when validation fails', async () => {
      mockReq.query = { page: 'invalid' };

      await handleListVisits(mockReq as Request, mockRes as Response, mockNext);

      expect(ListRecentVisitsUseCase.listRecentVisits).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(z.ZodError));
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('should call next() with the error when the use case throws', async () => {
      mockReq.query = { page: '1' };
      const useCaseError = new Error('DB Error');
      vi.mocked(ListRecentVisitsUseCase.listRecentVisits).mockRejectedValue(useCaseError);

      await handleListVisits(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(useCaseError);
      expect(mockStatus).not.toHaveBeenCalled();
    });
  });
});
