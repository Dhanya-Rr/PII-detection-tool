/**
 * Authentication API Functions
 * 
 * This module provides functions for interacting with Django authentication endpoints.
 * Uses JWT tokens for authentication.
 */

import { getApiUrl } from './client';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * User data returned from the API
 */
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

/**
 * JWT tokens returned from login
 */
export interface AuthTokens {
  access: string;
  refresh: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Login response from API
 */
export interface LoginResponse {
  message: string;
  tokens: AuthTokens;
  user: User;
}

/**
 * Register response from API
 */
export interface RegisterResponse {
  message: string;
  user: User;
}

/**
 * Me response from API
 */
export interface MeResponse {
  user: User;
}

/**
 * API error response
 */
export interface AuthError {
  detail?: string;
  username?: string[];
  email?: string[];
  password?: string[];
  non_field_errors?: string[];
}

// =============================================================================
// TOKEN STORAGE
// =============================================================================

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Store authentication tokens in localStorage
 */
export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
}

/**
 * Get the access token from localStorage
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get the refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Clear all authentication tokens from localStorage
 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Check if user has stored tokens
 */
export function hasStoredTokens(): boolean {
  return !!getAccessToken() && !!getRefreshToken();
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Make an authenticated API request with JWT token
 */
async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };
  
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const response = await fetch(getApiUrl(endpoint), {
    ...options,
    headers,
  });
  
  // Handle 401 - try to refresh token
  if (response.status === 401 && accessToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      const newAccessToken = getAccessToken();
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
      
      const retryResponse = await fetch(getApiUrl(endpoint), {
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
    throw new Error(JSON.stringify(errorData));
  }
  
  return response.json();
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await fetch(getApiUrl('/api/auth/token/refresh/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    
    // Store the new tokens
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
    if (data.refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch(getApiUrl('/api/auth/register/'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw responseData;
  }
  
  return responseData;
}

/**
 * Login user and get JWT tokens
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(getApiUrl('/api/auth/login/'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw responseData;
  }
  
  // Store tokens
  storeTokens(responseData.tokens);
  
  return responseData;
}

/**
 * Logout user and invalidate refresh token
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  
  if (refreshToken) {
    try {
      await authFetch('/api/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch {
      // Ignore errors during logout - tokens will be cleared anyway
    }
  }
  
  clearTokens();
}

/**
 * Get current authenticated user details
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!hasStoredTokens()) {
    return null;
  }
  
  try {
    const response = await authFetch<MeResponse>('/api/auth/me/', {
      method: 'GET',
    });
    return response.user;
  } catch {
    clearTokens();
    return null;
  }
}

/**
 * Parse authentication error response
 */
export function parseAuthError(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as AuthError;
      
      // Check for specific field errors
      if (parsed.detail) return parsed.detail;
      if (parsed.username?.length) return parsed.username[0];
      if (parsed.email?.length) return parsed.email[0];
      if (parsed.password?.length) return parsed.password[0];
      if (parsed.non_field_errors?.length) return parsed.non_field_errors[0];
      
      return 'An error occurred. Please try again.';
    } catch {
      return error.message;
    }
  }
  
  // Handle error object directly (thrown from fetch)
  if (typeof error === 'object' && error !== null) {
    const authError = error as AuthError;
    if (authError.detail) return authError.detail;
    if (authError.username?.length) return authError.username[0];
    if (authError.email?.length) return authError.email[0];
    if (authError.password?.length) return authError.password[0];
    if (authError.non_field_errors?.length) return authError.non_field_errors[0];
  }
  
  return 'An unexpected error occurred.';
}
