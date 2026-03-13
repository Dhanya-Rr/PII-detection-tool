/**
 * API Client Configuration
 * 
 * This module provides utilities for communicating with the Django backend.
 * It handles base URL configuration, request defaults, and common API patterns.
 * 
 * Environment Variables:
 *   VITE_API_BASE_URL - Base URL for the Django backend (default: http://127.0.0.1:8000)
 */

// Get the backend base URL from environment variables
// Falls back to localhost:8000 if not configured
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Debug: Log the API base URL on module load
console.log('[API Client] Base URL:', API_BASE_URL);
console.log('[API Client] Env variable:', import.meta.env.VITE_API_BASE_URL);

/**
 * Health check response interface
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  service: string;
  environment: string;
}

/**
 * Backend connection status
 */
export interface BackendStatus {
  connected: boolean;
  message: string;
  environment?: string;
  timestamp: Date;
}

/**
 * Generic API error response
 */
export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

/**
 * Creates a full API URL from an endpoint path
 * @param endpoint - The API endpoint path (e.g., '/api/health')
 * @returns Full URL string
 */
export function getApiUrl(endpoint: string): string {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
}

/**
 * Default fetch options for API requests
 */
const defaultFetchOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Makes a GET request to the API
 * @param endpoint - The API endpoint path
 * @param options - Additional fetch options
 * @returns Promise with the parsed JSON response
 */
export async function apiGet<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = getApiUrl(endpoint);
  const response = await fetch(url, {
    ...defaultFetchOptions,
    ...options,
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`API GET ${endpoint} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Makes a POST request to the API
 * @param endpoint - The API endpoint path
 * @param data - Request body data
 * @param options - Additional fetch options
 * @returns Promise with the parsed JSON response
 */
export async function apiPost<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
  const url = getApiUrl(endpoint);
  const response = await fetch(url, {
    ...defaultFetchOptions,
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API POST ${endpoint} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Checks the backend health status
 * 
 * Calls GET /api/health and returns connection status.
 * This is used to verify backend availability on app startup.
 * 
 * @returns Promise with BackendStatus object
 */
export async function checkBackendHealth(): Promise<BackendStatus> {
  try {
    const response = await apiGet<HealthCheckResponse>('/api/health');
    
    return {
      connected: response.status === 'ok',
      message: `Connected to ${response.service}`,
      environment: response.environment,
      timestamp: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      connected: false,
      message: `Backend unavailable: ${errorMessage}`,
      timestamp: new Date(),
    };
  }
}

/**
 * Export the base URL for debugging purposes
 */
export { API_BASE_URL };
