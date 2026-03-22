import { apiClient } from '@/lib/api-client';
import type { ListVisitsResponse, ListVisitsRequest } from '@demo-pat-reg/shared';

/**
 * Service function fetching visits data using native fetch and strict shared contracts.
 */
export const getVisits = async (params: ListVisitsRequest): Promise<ListVisitsResponse> => {
  return await apiClient.get<ListVisitsResponse>('/visits', {
    params,
  });
};
