/**
 * Backend Status Provider
 * 
 * A context provider that manages backend connection status across the app.
 * Performs a health check on mount and provides status to all child components.
 * 
 * This provider is intentionally non-visual - it only logs to console
 * and provides status through context without affecting the UI.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useBackendStatus } from '@/hooks/use-backend-status';
import { BackendStatus } from '@/api/client';

/**
 * Context value interface
 */
interface BackendStatusContextType {
  /** Whether the backend is currently connected */
  isConnected: boolean;
  /** Whether a health check is in progress */
  isChecking: boolean;
  /** Full backend status object */
  status: BackendStatus | null;
  /** Function to manually recheck the connection */
  recheckConnection: () => Promise<void>;
}

/**
 * Default context value
 */
const defaultContextValue: BackendStatusContextType = {
  isConnected: false,
  isChecking: true,
  status: null,
  recheckConnection: async () => {},
};

/**
 * Backend status context
 */
const BackendStatusContext = createContext<BackendStatusContextType>(defaultContextValue);

/**
 * Provider props
 */
interface BackendStatusProviderProps {
  children: ReactNode;
}

/**
 * Backend Status Provider Component
 * 
 * Wraps the application and provides backend connection status.
 * Automatically checks health on mount.
 * 
 * @param children - Child components to wrap
 */
export function BackendStatusProvider({ children }: BackendStatusProviderProps) {
  const backendStatus = useBackendStatus(true); // Check on mount

  return (
    <BackendStatusContext.Provider value={backendStatus}>
      {children}
    </BackendStatusContext.Provider>
  );
}

/**
 * Hook to access backend status from any component
 * 
 * @returns BackendStatusContextType with connection status and utilities
 * @throws Error if used outside of BackendStatusProvider
 * 
 * @example
 * const { isConnected, recheckConnection } = useBackendStatusContext();
 * if (!isConnected) {
 *   console.log('Backend is offline');
 * }
 */
export function useBackendStatusContext(): BackendStatusContextType {
  const context = useContext(BackendStatusContext);
  
  if (context === undefined) {
    throw new Error('useBackendStatusContext must be used within a BackendStatusProvider');
  }
  
  return context;
}

export default BackendStatusProvider;
