/**
 * Centrally configured fetch client.
 * Automatically prepends the base URL from environment variables to all requests,
 * keeping UI fetching logic extremely clean.
 */
export const apiClient = {
  get: async <T>(path: string, options?: RequestInit & { params?: Record<string, string | number | undefined> }): Promise<T> => {
    const url = new URL(`${import.meta.env.VITE_API_URL}${path}`);
    
    // Append query parameters if provided
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    console.log('[FRONTEND] Fetching:', url.toString());
    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  },
};
