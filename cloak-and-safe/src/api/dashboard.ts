/**
 * Dashboard API Functions
 * 
 * This module provides functions for fetching dashboard metrics and analytics.
 * All endpoints require JWT authentication.
 * 
 * PII Distribution now uses real scan results from the backend.
 */

import { getApiUrl } from './client';
import { getAccessToken, refreshAccessToken, clearTokens } from './auth';
import { fetchScanResults, aggregatePIIDistribution } from './piiScan';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Dashboard statistics for a project
 */
export interface DashboardStats {
  totalScans: number;
  piiFieldsFound: number;
  dataMasked: number;
  tablesScanned: number;
}

/**
 * PII distribution data for charts
 */
export interface PIIDistributionItem {
  name: string;
  value: number;
  color: string;
}

/**
 * Masking methods distribution data
 */
export interface MaskingMethodItem {
  name: string;
  value: number;
  color: string;
}

/**
 * Recent activity item
 */
export interface ActivityItem {
  id: string;
  type: 'scan' | 'mask' | 'export';
  description: string;
  timestamp: string;
  projectId: string;
}

/**
 * Full dashboard data response
 */
export interface DashboardData {
  stats: DashboardStats;
  piiDistribution: PIIDistributionItem[];
  maskingMethods: MaskingMethodItem[];
  recentActivity: ActivityItem[];
}

/**
 * API loading state
 */
export interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// DEFAULT EMPTY STATE
// =============================================================================

export const EMPTY_DASHBOARD_DATA: DashboardData = {
  stats: {
    totalScans: 0,
    piiFieldsFound: 0,
    dataMasked: 0,
    tablesScanned: 0,
  },
  piiDistribution: [],
  maskingMethods: [],
  recentActivity: [],
};

// =============================================================================
// API HELPERS
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
  
  console.log('[Dashboard API] Request:', { url, method: options.method || 'GET' });
  
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
    console.error('[Dashboard API] Network error:', networkError);
    throw new Error('Network error: Unable to reach backend server');
  }
  
  console.log('[Dashboard API] Response status:', response.status);
  
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
  
  // Handle 404 - endpoint not implemented yet
  if (response.status === 404) {
    console.warn('[Dashboard API] Endpoint not found - returning empty data');
    throw new Error('Endpoint not implemented');
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

// API response types (snake_case from backend)
interface StatsApiResponse {
  total_scans: number;
  pii_fields_found: number;
  data_masked: number;
  tables_scanned: number;
}

interface PIIDistributionApiResponse {
  email: number;
  phone: number;
  ssn: number;
  address: number;
  name: number;
}

interface MaskingMethodsApiResponse {
  masking: number;
  redaction: number;
  pseudonymization: number;
  tokenization: number;
}

// Color mappings for charts
const PII_COLORS: Record<string, string> = {
  email: '#3b82f6',
  phone: '#10b981',
  ssn: '#f59e0b',
  address: '#8b5cf6',
  name: '#ec4899',
};

const MASKING_COLORS: Record<string, string> = {
  masking: '#3b82f6',
  redaction: '#ef4444',
  pseudonymization: '#10b981',
  tokenization: '#f59e0b',
};

/**
 * Fetch dashboard statistics for a project
 * 
 * Combines stats from the stats endpoint with real scan results.
 * 
 * @param projectId - UUID of the project
 * @returns Dashboard statistics
 */
export async function fetchDashboardStats(projectId: string): Promise<DashboardStats> {
  try {
    // Fetch both stats and scan results in parallel
    const [statsResponse, scanResponse] = await Promise.all([
      authFetch<StatsApiResponse>(`/api/projects/${projectId}/stats/`).catch(() => null),
      fetchScanResults(projectId).catch(() => null),
    ]);
    
    // Get PII fields count from scan results (real data)
    const piiFieldsFound = scanResponse?.count ?? 0;
    
    // Get unique tables from scan results
    const uniqueTables = scanResponse?.results 
      ? new Set(scanResponse.results.map(r => r.table_name)).size 
      : 0;
    
    return {
      totalScans: statsResponse?.total_scans ?? (scanResponse?.count ? 1 : 0),
      piiFieldsFound: piiFieldsFound,
      dataMasked: statsResponse?.data_masked ?? 0,
      tablesScanned: uniqueTables || (statsResponse?.tables_scanned ?? 0),
    };
  } catch (error) {
    console.warn('[Dashboard API] Stats fetch failed:', error);
    return EMPTY_DASHBOARD_DATA.stats;
  }
}

/**
 * Fetch PII distribution data for charts from real scan results
 * 
 * @param projectId - UUID of the project
 * @returns Array of PII distribution items
 */
export async function fetchPIIDistribution(projectId: string): Promise<PIIDistributionItem[]> {
  try {
    // Fetch real scan results from the backend
    const scanResults = await fetchScanResults(projectId);
    
    // Aggregate results into chart format
    const distribution = aggregatePIIDistribution(scanResults.results);
    
    return distribution;
  } catch (error) {
    console.warn('[Dashboard API] Failed to fetch PII distribution from scan results:', error);
    // Return empty array on error - no mock data fallback
    return [];
  }
}

/**
 * Fetch masking methods distribution
 * 
 * @param projectId - UUID of the project
 * @returns Array of masking method items
 */
export async function fetchMaskingMethods(projectId: string): Promise<MaskingMethodItem[]> {
  try {
    const response = await authFetch<MaskingMethodsApiResponse>(
      `/api/projects/${projectId}/masking-methods/`
    );
    // Transform object to array with colors
    return Object.entries(response).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value ?? 0,
      color: MASKING_COLORS[key] || '#6b7280',
    }));
  } catch (error) {
    console.warn('[Dashboard API] Masking methods endpoint not available:', error);
    return [];
  }
}

/**
 * Fetch recent activity for a project
 * 
 * @param projectId - UUID of the project
 * @param limit - Maximum number of items to return
 * @returns Array of activity items
 */
export async function fetchRecentActivity(
  projectId: string,
  limit: number = 10
): Promise<ActivityItem[]> {
  try {
    const response = await authFetch<{ activities: ActivityItem[] }>(
      `/api/projects/${projectId}/activity/?limit=${limit}`
    );
    return response.activities;
  } catch (error) {
    console.warn('[Dashboard API] Activity endpoint not available:', error);
    return [];
  }
}

/**
 * Fetch all dashboard data in one call
 * 
 * @param projectId - UUID of the project
 * @returns Complete dashboard data
 */
export async function fetchDashboardData(projectId: string): Promise<DashboardData> {
  // Fetch all data in parallel
  const [stats, piiDistribution, maskingMethods, recentActivity] = await Promise.all([
    fetchDashboardStats(projectId),
    fetchPIIDistribution(projectId),
    fetchMaskingMethods(projectId),
    fetchRecentActivity(projectId),
  ]);
  
  return {
    stats,
    piiDistribution,
    maskingMethods,
    recentActivity,
  };
}

/**
 * Parse dashboard API errors
 */
export function parseDashboardError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Network error')) {
      return 'Unable to connect to server';
    }
    if (error.message.includes('not authenticated')) {
      return 'Please log in to view dashboard';
    }
    if (error.message.includes('not implemented')) {
      return 'Data not available yet';
    }
    try {
      const parsed = JSON.parse(error.message);
      return parsed.detail || 'An error occurred';
    } catch {
      return error.message;
    }
  }
  return 'An unexpected error occurred';
}
