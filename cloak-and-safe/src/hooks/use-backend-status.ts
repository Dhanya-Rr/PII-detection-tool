/**
 * Backend Status Hook
 * 
 * Custom React hook for managing backend connection status.
 * Checks backend health on mount and provides status to components.
 * 
 * Usage:
 *   const { isConnected, isChecking, status, recheckConnection } = useBackendStatus();
 */

import { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth, BackendStatus } from '@/api/client';

/**
 * Hook return type
 */
interface UseBackendStatusReturn {
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
 * Custom hook to check and monitor backend connection status
 * 
 * @param checkOnMount - Whether to check health on component mount (default: true)
 * @returns Object with connection status and recheck function
 */
export function useBackendStatus(checkOnMount: boolean = true): UseBackendStatusReturn {
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  /**
   * Performs a health check against the backend
   */
  const recheckConnection = useCallback(async () => {
    setIsChecking(true);
    
    try {
      const healthStatus = await checkBackendHealth();
      setStatus(healthStatus);
      
      // Log status to console for debugging
      if (healthStatus.connected) {
        console.log(
          `%c✓ Backend Connected %c${healthStatus.message} (${healthStatus.environment})`,
          'color: #10b981; font-weight: bold;',
          'color: #6b7280;'
        );
      } else {
        console.warn(
          `%c✗ Backend Disconnected %c${healthStatus.message}`,
          'color: #ef4444; font-weight: bold;',
          'color: #6b7280;'
        );
      }
    } catch (error) {
      const errorStatus: BackendStatus = {
        connected: false,
        message: error instanceof Error ? error.message : 'Connection check failed',
        timestamp: new Date(),
      };
      setStatus(errorStatus);
      console.error('Backend health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check connection on mount if enabled
  useEffect(() => {
    if (checkOnMount) {
      recheckConnection();
    }
  }, [checkOnMount, recheckConnection]);

  return {
    isConnected: status?.connected ?? false,
    isChecking,
    status,
    recheckConnection,
  };
}

export default useBackendStatus;
