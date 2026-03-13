/**
 * Masking API Functions (Phase 6)
 * 
 * This module provides functions for interacting with Django masking endpoints.
 * All endpoints require JWT authentication.
 * 
 * Features:
 * - Start masking jobs
 * - Stream real-time progress via SSE
 * - Get masking results
 */

import { getApiUrl } from './client';
import { getAccessToken, refreshAccessToken, clearTokens } from './auth';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Masking job status
 */
export type MaskingJobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Masking field status
 */
export type MaskingFieldStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Progress step types
 */
export type MaskingStep = 'analysis' | 'strategy_selection' | 'masking' | 'validation' | 'completed' | 'error';

/**
 * Masking field data
 */
export interface MaskingField {
  id: number;
  table_name: string;
  column_name: string;
  pii_type: string;
  masking_strategy: string;
  original_sample: string;
  masked_sample: string;
  status: MaskingFieldStatus;
  processed_at: string | null;
}

/**
 * Masking log entry
 */
export interface MaskingLog {
  id: number;
  step: MaskingStep;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  field_name: string | null;
  created_at: string;
}

/**
 * Masking job data
 */
export interface MaskingJob {
  id: string;
  project: string;
  database_name: string;
  table_name: string | null;
  status: MaskingJobStatus;
  total_fields: number;
  processed_fields: number;
  progress_percentage: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  masking_fields?: MaskingField[];
  logs?: MaskingLog[];
}

/**
 * Start masking job response
 */
export interface StartMaskingJobResponse {
  job_id: string;
  message: string;
  total_fields: number;
  stream_url: string;
}

/**
 * Field configuration for masking
 * Used when starting a job with custom technique selections
 */
export interface FieldConfiguration {
  field_id?: string;
  field_name?: string;
  table_name?: string;
  technique: string;
  method?: 'masking' | 'anonymization';
  parameters?: Record<string, string>;
}

/**
 * Masking progress event from SSE
 * 
 * Event types from backend:
 * - analysis: Initial field analysis
 * - strategy_selection: Assigning masking strategies (includes strategies array)
 * - masking: Processing individual fields (includes field, status, samples)
 * - validation: Validating masked results
 * - completed: Job finished (includes results array)
 * - error: Error occurred
 */
export interface MaskingProgressEvent {
  job_id: string;
  step: MaskingStep;
  message: string;
  progress: number;
  timestamp: string;
  // Field-specific data (during masking step)
  field?: string;
  pii_type?: string;
  strategy?: string;
  strategy_display?: string;
  status?: 'processing' | 'completed';
  original_sample?: string;
  masked_sample?: string;
  current_field?: number;
  total_fields?: number;
  validation_passed?: boolean;
  results?: MaskingFieldResult[];
  strategies?: StrategyAssignment[];
  // Real data processing fields (from execute_masking_job)
  real_data_processed?: boolean;
  tables_processed?: number;
  rows_processed?: number;
  datasets?: Array<{ table_name: string; row_count: number; dataset_id?: string }>;
}

/**
 * Strategy assignment
 */
export interface StrategyAssignment {
  field: string;
  pii_type: string;
  strategy: string;
}

/**
 * Masking field result
 */
export interface MaskingFieldResult {
  field: string;
  table: string;
  pii_type: string;
  strategy: string;
  original_sample: string;
  masked_sample: string;
}

/**
 * Masking preview response
 */
export interface MaskingPreviewResponse {
  original: string;
  masked: string;
  strategy: string;
  pii_type: string;
}

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
  
  console.log('[Masking API] Request:', { url, method: options.method || 'GET', hasToken: !!accessToken });
  
  if (!accessToken) {
    console.warn('[Masking API] No access token found - user may not be logged in');
    throw new Error('Authentication required. Please login first.');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
    'Authorization': `Bearer ${accessToken}`,
  };
  
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    console.error('[Masking API] Network error:', networkError);
    throw new Error('Network error: Unable to reach the server.');
  }
  
  console.log('[Masking API] Response status:', response.status);
  
  // Handle 401 - try to refresh token
  if (response.status === 401 && accessToken) {
    console.log('[Masking API] Token expired, attempting refresh...');
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newAccessToken = getAccessToken();
      const retryHeaders: HeadersInit = {
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
    console.error('[Masking API] Error response:', { status: response.status, data: errorData });
    throw new Error(JSON.stringify(errorData));
  }
  
  return response.json();
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * List all masking jobs for a project
 */
export async function listMaskingJobs(
  projectId: string
): Promise<{ jobs: MaskingJob[]; count: number }> {
  return authFetch<{ jobs: MaskingJob[]; count: number }>(
    `/api/projects/${projectId}/masking/`,
    { method: 'GET' }
  );
}

/**
 * Get masking job details
 */
export async function getMaskingJob(
  projectId: string,
  jobId: string
): Promise<{ job: MaskingJob }> {
  return authFetch<{ job: MaskingJob }>(
    `/api/projects/${projectId}/masking/${jobId}/`,
    { method: 'GET' }
  );
}

/**
 * Start a new masking job
 * 
 * @param projectId - UUID of the project
 * @param tableName - Optional table to filter fields
 * @param fieldConfigurations - Optional array of field technique configurations
 */
export async function startMaskingJob(
  projectId: string,
  tableName?: string,
  fieldConfigurations?: FieldConfiguration[]
): Promise<StartMaskingJobResponse> {
  return authFetch<StartMaskingJobResponse>(
    `/api/projects/${projectId}/masking/start/`,
    {
      method: 'POST',
      body: JSON.stringify({ 
        table_name: tableName || null,
        field_configurations: fieldConfigurations || []
      }),
    }
  );
}

/**
 * Get masking job results
 */
export async function getMaskingJobResults(
  projectId: string,
  jobId: string
): Promise<{
  job_id: string;
  status: MaskingJobStatus;
  total_fields: number;
  processed_fields: number;
  progress_percentage: number;
  results: MaskingFieldResult[];
  completed_at: string | null;
}> {
  return authFetch(
    `/api/projects/${projectId}/masking/${jobId}/results/`,
    { method: 'GET' }
  );
}

/**
 * Preview masking on sample data
 */
export async function previewMasking(
  projectId: string,
  value: string,
  piiType: string
): Promise<MaskingPreviewResponse> {
  return authFetch<MaskingPreviewResponse>(
    `/api/projects/${projectId}/masking/preview/`,
    {
      method: 'POST',
      body: JSON.stringify({ value, pii_type: piiType }),
    }
  );
}

/**
 * Create an EventSource connection for real-time masking progress
 * 
 * Uses native EventSource API with JWT token passed as query parameter
 * since EventSource doesn't support custom headers.
 * 
 * @param projectId - UUID of the project
 * @param jobId - UUID of the masking job
 * @param onProgress - Callback for progress events
 * @param onComplete - Callback when job completes
 * @param onError - Callback for errors
 * @returns Cleanup function to close the connection
 */
export function streamMaskingProgress(
  projectId: string,
  jobId: string,
  onProgress: (event: MaskingProgressEvent) => void,
  onComplete: (event: MaskingProgressEvent) => void,
  onError: (error: string) => void
): () => void {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    onError('Authentication required. Please login first.');
    return () => {};
  }
  
  // Build URL with token as query parameter (EventSource doesn't support custom headers)
  const baseUrl = getApiUrl(`/api/projects/${projectId}/masking/${jobId}/stream/`);
  const url = `${baseUrl}?token=${encodeURIComponent(accessToken)}`;
  
  console.log('[Masking SSE] Connecting to:', baseUrl);
  
  // Use native EventSource for reliable SSE handling
  const eventSource = new EventSource(url);
  
  eventSource.onopen = () => {
    console.log('[Masking SSE] Connection opened');
  };
  
  eventSource.onmessage = (event) => {
    console.log('[Masking SSE] Received message:', event.data.substring(0, 100));
    
    try {
      const eventData = JSON.parse(event.data) as MaskingProgressEvent;
      console.log('[Masking SSE] Parsed event:', eventData.step, eventData.field || '');
      
      if (eventData.step === 'completed') {
        onComplete(eventData);
        eventSource.close();
      } else if (eventData.step === 'error') {
        onError(eventData.message);
        eventSource.close();
      } else {
        onProgress(eventData);
      }
    } catch (e) {
      console.warn('[Masking SSE] Failed to parse event:', event.data, e);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('[Masking SSE] Connection error:', error);
    
    // Check if the connection was closed normally
    if (eventSource.readyState === EventSource.CLOSED) {
      console.log('[Masking SSE] Connection closed');
      return;
    }
    
    // EventSource will try to reconnect by default, but we should handle errors
    onError('SSE connection error. The masking job may still be running.');
    eventSource.close();
  };
  
  // Return cleanup function
  return () => {
    console.log('[Masking SSE] Closing connection');
    eventSource.close();
  };
}

/**
 * Parse masking API error response
 */
export function parseMaskingError(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.detail) return parsed.detail;
      if (parsed.message) return parsed.message;
      return error.message;
    } catch {
      return error.message;
    }
  }
  return 'An unexpected error occurred';
}

// =============================================================================
// PHASE 7: AUDIT LOGS & EXECUTION CONSOLE
// =============================================================================

/**
 * Audit log entry from the backend
 */
export interface AuditLogEntry {
  timestamp: string;
  action: string;
  field: string | null;
  status: 'started' | 'processing' | 'completed' | 'error';
  message: string;
}

/**
 * Audit logs response
 */
export interface AuditLogsResponse {
  job_id: string;
  status: MaskingJobStatus;
  logs: AuditLogEntry[];
  total_logs: number;
}

/**
 * Fetch audit logs for a masking job
 */
export async function fetchAuditLogs(
  projectId: string,
  jobId: string
): Promise<AuditLogsResponse> {
  return authFetch<AuditLogsResponse>(
    `/api/projects/${projectId}/masking/${jobId}/logs/`,
    { method: 'GET' }
  );
}

/**
 * Stream audit logs in real-time via SSE
 * 
 * @param projectId - UUID of the project
 * @param jobId - UUID of the masking job
 * @param onLog - Callback for each log entry
 * @param onComplete - Callback when job completes
 * @param onError - Callback for errors
 * @returns Cleanup function to close the connection
 */
export function streamAuditLogs(
  projectId: string,
  jobId: string,
  onLog: (log: AuditLogEntry) => void,
  onComplete: (status: string) => void,
  onError: (error: string) => void
): () => void {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    onError('Authentication required. Please login first.');
    return () => {};
  }
  
  // Build URL with token as query parameter
  const baseUrl = getApiUrl(`/api/projects/${projectId}/masking/${jobId}/logs/stream/`);
  const url = `${baseUrl}?token=${encodeURIComponent(accessToken)}`;
  
  console.log('[AuditLogs SSE] Connecting to:', baseUrl);
  
  const eventSource = new EventSource(url);
  
  eventSource.onopen = () => {
    console.log('[AuditLogs SSE] Connection opened');
  };
  
  eventSource.onmessage = (event) => {
    console.log('[AuditLogs SSE] Received:', event.data.substring(0, 100));
    
    try {
      const data = JSON.parse(event.data);
      
      // Check if it's a job status event
      if (data.type === 'job_status') {
        onComplete(data.status);
        eventSource.close();
        return;
      }
      
      // Regular log entry
      onLog(data as AuditLogEntry);
    } catch (e) {
      console.warn('[AuditLogs SSE] Failed to parse:', event.data, e);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('[AuditLogs SSE] Connection error:', error);
    
    if (eventSource.readyState === EventSource.CLOSED) {
      console.log('[AuditLogs SSE] Connection closed');
      return;
    }
    
    onError('Audit log stream connection error.');
    eventSource.close();
  };
  
  return () => {
    console.log('[AuditLogs SSE] Closing connection');
    eventSource.close();
  };
}


// =============================================================================
// PHASE 8: REAL DATA PROCESSING
// =============================================================================

/**
 * Masked dataset info
 */
export interface MaskedDatasetInfo {
  id: number;
  table_name: string;
  original_row_count: number;
  masked_row_count: number;
  column_mapping: Record<string, { strategy: string; pii_type: string }>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string | null;
}

/**
 * Execute masking response
 */
export interface ExecuteMaskingResponse {
  message: string;
  job_id: string;
  status: string;
  tables_processed: number;
  rows_processed: number;
  datasets: Array<{
    table_name: string;
    row_count: number;
    dataset_id?: string;
  }>;
}

/**
 * Push response
 */
export interface PushMaskedDataResponse {
  message: string;
  status: string;
  tables_updated: number;
  rows_affected: number;
  details: Array<{
    table_name: string;
    rows_affected?: number;
    operation: string;
    error?: string;
  }>;
}

/**
 * Preview data response
 */
export interface MaskedDataPreviewResponse {
  job_id: string;
  tables: Array<{
    table_name: string;
    columns: string[];
    rows: Record<string, unknown>[];
    total_rows: number;
    preview_count: number;
  }>;
  limit: number;
}

/**
 * Execute masking job on real database data
 * 
 * @param projectId - UUID of the project
 * @param jobId - UUID of the masking job
 */
export async function executeMaskingJob(
  projectId: string,
  jobId: string
): Promise<ExecuteMaskingResponse> {
  return authFetch<ExecuteMaskingResponse>(
    `/api/projects/${projectId}/masking/${jobId}/execute/`,
    { method: 'POST' }
  );
}

/**
 * Export masked data as CSV or JSON
 * 
 * @param projectId - UUID of the project
 * @param jobId - UUID of the masking job
 * @param format - Export format ('csv' or 'json')
 * @param tableName - Optional specific table to export
 */
export async function exportMaskedData(
  projectId: string,
  jobId: string,
  format: 'csv' | 'json' = 'csv',
  tableName?: string
): Promise<Blob> {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    throw new Error('Authentication required. Please login first.');
  }
  
  let endpoint = `/api/projects/${projectId}/masking/${jobId}/export/?format=${format}`;
  if (tableName) {
    endpoint += `&table_name=${encodeURIComponent(tableName)}`;
  }
  
  const url = getApiUrl(endpoint);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to export data');
  }
  
  return response.blob();
}

/**
 * Download exported masked data
 * 
 * @param projectId - UUID of the project
 * @param jobId - UUID of the masking job
 * @param format - Export format ('csv' or 'json')
 */
export async function downloadMaskedData(
  projectId: string,
  jobId: string,
  format: 'csv' | 'json' = 'csv'
): Promise<void> {
  const blob = await exportMaskedData(projectId, jobId, format);
  
  // Create download link
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `masked_data_${jobId.substring(0, 8)}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * Push masked data to database
 * 
 * @param projectId - UUID of the project
 * @param jobId - UUID of the masking job
 * @param mode - 'update' to update original table, 'insert' to create new masked table
 */
export async function pushMaskedData(
  projectId: string,
  jobId: string,
  mode: 'update' | 'insert' = 'insert'
): Promise<PushMaskedDataResponse> {
  return authFetch<PushMaskedDataResponse>(
    `/api/projects/${projectId}/masking/${jobId}/push/`,
    {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }
  );
}

/**
 * List masked datasets for a job
 * 
 * @param projectId - UUID of the project
 * @param jobId - UUID of the masking job
 */
export async function listMaskedDatasets(
  projectId: string,
  jobId: string
): Promise<{
  job_id: string;
  datasets: MaskedDatasetInfo[];
  total_datasets: number;
}> {
  return authFetch(
    `/api/projects/${projectId}/masking/${jobId}/datasets/`,
    { method: 'GET' }
  );
}

/**
 * Preview masked data (first few rows)
 * 
 * @param projectId - UUID of the project
 * @param jobId - UUID of the masking job
 * @param tableName - Optional specific table to preview
 * @param limit - Number of rows to preview (default: 10)
 */
export async function previewMaskedData(
  projectId: string,
  jobId: string,
  tableName?: string,
  limit: number = 10
): Promise<MaskedDataPreviewResponse> {
  let endpoint = `/api/projects/${projectId}/masking/${jobId}/preview-data/?limit=${limit}`;
  if (tableName) {
    endpoint += `&table_name=${encodeURIComponent(tableName)}`;
  }
  
  return authFetch<MaskedDataPreviewResponse>(endpoint, { method: 'GET' });
}
