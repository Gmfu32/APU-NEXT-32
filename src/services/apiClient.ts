/**
 * APU NEXT — Standalone API Client Abstraction
 *
 * Designed for seamless future integration with an independent Python / FastAPI backend.
 * Zero proprietary runtime dependencies. Runs locally with Vite environment variables.
 */

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  useMockData: import.meta.env.VITE_USE_MOCK_DATA !== 'false',
};

export interface ApiResponse<T> {
  data: T;
  simulated: boolean;
  timestamp: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  mockFallback?: () => T
): Promise<ApiResponse<T>> {
  if (API_CONFIG.useMockData && mockFallback) {
    return {
      data: mockFallback(),
      simulated: true,
      timestamp: new Date().toISOString(),
    };
  }

  const token = localStorage.getItem('apu_next_access_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error (${response.status}): ${response.statusText}`);
  }

  const json = (await response.json()) as T;
  return {
    data: json,
    simulated: false,
    timestamp: new Date().toISOString(),
  };
}
