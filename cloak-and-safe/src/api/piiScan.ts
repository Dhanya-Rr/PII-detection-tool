/**
 * PII Scan API Functions
 * 
 * This module provides functions for triggering PII detection scans
 * and fetching scan results from the backend.
 * All endpoints require JWT authentication.
 */

import { getApiUrl } from './client';
import { getAccessToken, refreshAccessToken, clearTokens } from './auth';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Response from starting a PII scan
 */
export interface StartScanResponse {
  message: string;
  detected_fields: number;
}

/**
 * Individual detected PII field from backend
 */
export interface DetectedPIIField {
  id: number;
  project: string;
  table_name: string;
  field_name: string;
  pii_type: string;
  confidence: number;
  created_at: string;
}

/**
 * Response from fetching scan results
 */
export interface ScanResultsResponse {
  results: DetectedPIIField[];
  count: number;
}

/**
 * Aggregated PII distribution for charts
 */
export interface PIITypeCount {
  name: string;
  value: number;
  color: string;
}

// =============================================================================
// COLOR MAPPING
// =============================================================================

const PII_TYPE_COLORS: Record<string, string> = {
  email: '#3b82f6',
  phone: '#10b981',
  card: '#f59e0b',
  ssn: '#ef4444',
  name: '#ec4899',
  address: '#8b5cf6',
  aadhaar: '#06b6d4',
  pan: '#84cc16',
  other: '#6b7280',
};

const PII_TYPE_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  card: 'Credit Card',
  ssn: 'SSN',
  name: 'Name',
  address: 'Address',
  aadhaar: 'Aadhaar',
  pan: 'PAN',
  other: 'Other',
};

// =============================================================================
// API HELPER
// =============================================================================

/**
 * Make an authenticated API request with JWT token
 */
async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();
  const url = getApiUrl(endpoint);
  
  console.log('[PII Scan API] Request:', { url, method: options.method || 'GET' });
  
  if (!accessToken) {
    throw new Error('No access token - user not authenticated');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    ...(options.headers || {}),
  };
  
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    console.error('[PII Scan API] Network error:', networkError);
    throw new Error('Scan failed - backend not reachable');
  }
  
  console.log('[PII Scan API] Response status:', response.status);
  
  // Handle 401 - try to refresh token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newAccessToken = getAccessToken();
      const retryHeaders = {
        ...headers,
        'Authorization': `Bearer ${newAccessToken}`,
      };
      
      const retryResponse = await fetch(url, {
        ...options,
        headers: retryHeaders,
      });
      
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({}));
        throw new Error(JSON.stringify(errorData));
      }
      
      return retryResponse.json();
    } else {
      clearTokens();
      throw new Error('Session expired. Please login again.');
    }
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(JSON.stringify(errorData));
  }
  
  return response.json();
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Start a PII detection scan for a project
 * 
 * @param projectId - UUID of the project to scan
 * @returns StartScanResponse with count of detected fields
 */
export async function startPiiScan(projectId: string): Promise<StartScanResponse> {
  return authFetch<StartScanResponse>(
    `/api/projects/${projectId}/scan/start/`,
    { method: 'POST' }
  );
}

/**
 * Fetch scan results for a project
 * 
 * @param projectId - UUID of the project
 * @returns ScanResultsResponse with array of detected PII fields
 */
export async function fetchScanResults(projectId: string): Promise<ScanResultsResponse> {
  return authFetch<ScanResultsResponse>(
    `/api/projects/${projectId}/scan/results/`
  );
}

/**
 * Aggregate scan results into PII distribution for charts
 * 
 * @param results - Array of detected PII fields
 * @returns Array of aggregated PII type counts with colors
 */
export function aggregatePIIDistribution(results: DetectedPIIField[]): PIITypeCount[] {
  const counts: Record<string, number> = {};
  
  // Count occurrences of each PII type
  for (const field of results) {
    const piiType = field.pii_type.toLowerCase();
    counts[piiType] = (counts[piiType] || 0) + 1;
  }
  
  // Transform to chart format
  return Object.entries(counts).map(([type, count]) => ({
    name: PII_TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    color: PII_TYPE_COLORS[type] || PII_TYPE_COLORS.other,
  }));
}

/**
 * Parse PII scan API errors
 */
export function parseScanError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('backend not reachable')) {
      return 'Scan failed - backend not reachable';
    }
    if (error.message.includes('not authenticated')) {
      return 'Please log in to run scans';
    }
    if (error.message.includes('Session expired')) {
      return 'Session expired. Please login again.';
    }
    try {
      const parsed = JSON.parse(error.message);
      return parsed.detail || parsed.message || 'Scan failed';
    } catch {
      return error.message;
    }
  }
  return 'An unexpected error occurred';
}
