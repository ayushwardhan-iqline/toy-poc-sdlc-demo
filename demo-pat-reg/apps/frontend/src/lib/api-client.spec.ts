import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './api-client';

describe('apiClient.get', () => {
  const originalApiUrl = import.meta.env.VITE_API_URL;

  beforeEach(() => {
    import.meta.env.VITE_API_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    import.meta.env.VITE_API_URL = originalApiUrl;
    vi.unstubAllGlobals();
  });

  it('builds the request URL with query params and default headers', async () => {
    const responsePayload = { ok: true };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(responsePayload),
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await apiClient.get('/visits', {
      params: { page: 2, search: 'john', pageSize: 10, ignored: undefined },
      headers: { Authorization: 'Bearer token' },
    });

    expect(response).toEqual(responsePayload);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/visits?page=2&search=john&pageSize=10',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        },
      })
    );
  });

  it('throws a descriptive error when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.get('/visits')).rejects.toThrow('API Error: 500 Internal Server Error');
  });
});
