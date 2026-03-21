import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';
import { handleListVisits } from './visit.handlers.js';
import * as ListRecentVisitsUseCase from '../use-cases/list-recent-visits.js';
import { Request, Response } from 'express';

// Mock the use case
vi.mock('../use-cases/list-recent-visits.js', () => ({
  listRecentVisits: vi.fn(),
}));

describe('visit.handlers', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: MockInstance;
  let mockStatus: MockInstance;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockReq = { query: {} };
    mockRes = {
      json: mockJson as any,
      status: mockStatus as any,
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

      await handleListVisits(mockReq as Request, mockRes as Response);

      expect(ListRecentVisitsUseCase.listRecentVisits).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
      expect(mockJson).toHaveBeenCalledWith(mockResult);
    });

    it('should successfully list visits with default query params if none provided', async () => {
      mockReq.query = {};
      const mockResult = {
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 }
      };
      vi.mocked(ListRecentVisitsUseCase.listRecentVisits).mockResolvedValue(mockResult);

      await handleListVisits(mockReq as Request, mockRes as Response);

      expect(ListRecentVisitsUseCase.listRecentVisits).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
      expect(mockJson).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 if validation fails', async () => {
      mockReq.query = { page: 'invalid' };

      await handleListVisits(mockReq as Request, mockRes as Response);

      expect(ListRecentVisitsUseCase.listRecentVisits).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation Error',
        })
      );
    });

    it('should return 500 if use case throws an unexpected error', async () => {
      mockReq.query = { page: '1' };
      vi.mocked(ListRecentVisitsUseCase.listRecentVisits).mockRejectedValue(new Error('DB Error'));

      await handleListVisits(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });
});
