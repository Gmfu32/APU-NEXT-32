/**
 * APU NEXT — Standalone API Client Abstraction
 *
 * Designed for seamless future integration with an independent Python / FastAPI backend.
 * Zero proprietary runtime dependencies. Runs locally with Vite environment variables.
 */

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
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
  const isMultipart = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(!isMultipart ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot reach the APU NEXT API at ${API_CONFIG.baseUrl}. Start the FastAPI server on port 8000 and check backend CORS settings. For a hosted frontend, set VITE_API_BASE_URL to the public HTTPS API URL and rebuild.`,
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(body?.detail || `Request failed (${response.status})`);
  }

  const json = (await response.json()) as T;
  return {
    data: json,
    simulated: false,
    timestamp: new Date().toISOString(),
  };
}
