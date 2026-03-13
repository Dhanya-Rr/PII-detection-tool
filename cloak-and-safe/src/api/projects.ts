/**
 * Projects API Functions
 * 
 * This module provides functions for interacting with Django project management endpoints.
 * All endpoints require JWT authentication.
 */

import { getApiUrl } from './client';
import { getAccessToken, refreshAccessToken, clearTokens } from './auth';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Project data returned from the API
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  owner_username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create project request payload
 */
export interface CreateProjectRequest {
  name: string;
  description?: string;
}

/**
 * List projects response
 */
export interface ProjectListResponse {
  projects: Project[];
  count: number;
}

/**
 * Single project response
 */
export interface ProjectResponse {
  message?: string;
  project: Project;
}

/**
 * Active project response
 */
export interface ActiveProjectResponse {
  active_project: Project | null;
  message?: string;
}

/**
 * Delete project response
 */
export interface DeleteProjectResponse {
  message: string;
}

/**
 * API error response
 */
export interface ProjectError {
  detail?: string;
  name?: string[];
  non_field_errors?: string[];
}

// =============================================================================
// LOCAL STORAGE FOR ACTIVE PROJECT (FALLBACK)
// =============================================================================

const ACTIVE_PROJECT_KEY = 'active_project_id';

/**
 * Store active project ID in localStorage as fallback
 */
export function storeActiveProjectId(projectId: string | null): void {
  if (projectId) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
  } else {
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
  }
}

/**
 * Get stored active project ID from localStorage
 */
export function getStoredActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

/**
 * Clear stored active project ID
 */
export function clearStoredActiveProjectId(): void {
  localStorage.removeItem(ACTIVE_PROJECT_KEY);
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
  
  // Debug logging
  console.log('[API] Request:', { url, method: options.method || 'GET', hasToken: !!accessToken });
  
  if (!accessToken) {
    console.warn('[API] No access token found - user may not be logged in');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };
  
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }
  
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    // Network-level error (server not running, CORS blocked, connection refused)
    console.error('[API] Network error:', networkError);
    throw new Error(`Network error: Unable to reach ${url}. Make sure the Django backend is running on http://127.0.0.1:8000`);
  }
  
  console.log('[API] Response status:', response.status);
  
  // Handle 401 - try to refresh token
  if (response.status === 401 && accessToken) {
    console.log('[API] Token expired, attempting refresh...');
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      const newAccessToken = getAccessToken();
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
      
      const retryResponse = await fetch(url, {
        ...options,
        headers,
      });
      
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({}));
        throw new Error(JSON.stringify(errorData));
      }
      
      return retryResponse.json();
    } else {
      // Refresh failed, clear tokens
      clearTokens();
      throw new Error('Session expired. Please login again.');
    }
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[API] Error response:', { status: response.status, data: errorData });
    throw new Error(JSON.stringify(errorData));
  }
  
  return response.json();
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch all projects for the authenticated user
 * 
 * @returns List of projects owned by the user
 */
export async function fetchProjects(): Promise<ProjectListResponse> {
  return authFetch<ProjectListResponse>('/api/projects/');
}

/**
 * Create a new project
 * 
 * @param data - Project creation data (name required, description optional)
 * @returns The created project
 */
export async function createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
  return authFetch<ProjectResponse>('/api/projects/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get details of a specific project
 * 
 * @param projectId - UUID of the project
 * @returns Project details
 */
export async function getProject(projectId: string): Promise<{ project: Project }> {
  return authFetch<{ project: Project }>(`/api/projects/${projectId}/`);
}

/**
 * Select a project as the active project
 * 
 * @param projectId - UUID of the project to select
 * @returns Updated project with is_active = true
 */
export async function selectProject(projectId: string): Promise<ProjectResponse> {
  const response = await authFetch<ProjectResponse>(`/api/projects/${projectId}/select/`, {
    method: 'POST',
  });
  
  // Also store in localStorage as fallback
  storeActiveProjectId(projectId);
  
  return response;
}

/**
 * Delete a project
 * 
 * @param projectId - UUID of the project to delete
 * @returns Success message
 */
export async function deleteProject(projectId: string): Promise<DeleteProjectResponse> {
  const storedActiveId = getStoredActiveProjectId();
  
  const response = await authFetch<DeleteProjectResponse>(`/api/projects/${projectId}/delete/`, {
    method: 'DELETE',
  });
  
  // Clear localStorage if we're deleting the active project
  if (storedActiveId === projectId) {
    clearStoredActiveProjectId();
  }
  
  return response;
}

/**
 * Get the currently active project for the user
 * 
 * @returns The active project or null if none selected
 */
export async function getActiveProject(): Promise<ActiveProjectResponse> {
  return authFetch<ActiveProjectResponse>('/api/projects/active/');
}

/**
 * Clear the active project (deselect)
 * 
 * @returns Success message
 */
export async function clearActiveProject(): Promise<{ message: string }> {
  clearStoredActiveProjectId();
  
  return authFetch<{ message: string }>('/api/projects/active/', {
    method: 'DELETE',
  });
}

/**
 * Parse an API error response
 * 
 * @param error - The error object (usually from catch block)
 * @returns Human-readable error message
 */
export function parseProjectError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Check for network errors first
    if (message.includes('Network error:') || message.includes('Unable to reach')) {
      return message;
    }
    
    if (message.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Make sure Django backend is running on http://127.0.0.1:8000';
    }
    
    try {
      const parsed = JSON.parse(message) as ProjectError;
      
      // Check for specific field errors
      if (parsed.name && parsed.name.length > 0) {
        return parsed.name[0];
      }
      
      if (parsed.detail) {
        return parsed.detail;
      }
      
      if (parsed.non_field_errors && parsed.non_field_errors.length > 0) {
        return parsed.non_field_errors[0];
      }
      
      return 'An error occurred while processing your request.';
    } catch {
      // If parse fails, return the original message
      return message;
    }
  }
  
  return 'An unexpected error occurred.';
}
