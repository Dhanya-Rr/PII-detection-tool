/**
 * Authentication Context for Django JWT Authentication
 * 
 * This context provides authentication state and methods throughout the application.
 * Replaces Supabase authentication with Django + JWT.
 * 
 * Features:
 *   - User state management
 *   - Login/Logout functionality
 *   - Registration support
 *   - Token refresh handling
 *   - Protected route support
 */

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  ReactNode 
} from 'react';
import { 
  User, 
  LoginRequest, 
  RegisterRequest,
  login as apiLogin, 
  logout as apiLogout, 
  register as apiRegister,
  getCurrentUser,
  hasStoredTokens,
  clearTokens,
  parseAuthError
} from '@/api/auth';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Authentication context state and methods
 */
interface AuthContextType {
  /** Current authenticated user or null if not logged in */
  user: User | null;
  
  /** Whether authentication check is in progress */
  loading: boolean;
  
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  
  /** 
   * Login with username/email and password
   * @returns Promise that resolves on success or rejects with error message
   */
  login: (credentials: LoginRequest) => Promise<void>;
  
  /**
   * Register a new user
   * @returns Promise that resolves on success or rejects with error message
   */
  register: (data: RegisterRequest) => Promise<void>;
  
  /**
   * Logout current user
   */
  logout: () => Promise<void>;
  
  /**
   * Refresh user data from backend
   */
  refreshUser: () => Promise<void>;
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication state and methods.
 * Automatically checks for existing session on mount.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  /**
   * Check for existing authentication on mount
   */
  const checkAuth = useCallback(async () => {
    if (!hasStoredTokens()) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      // Token is invalid or expired
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  /**
   * Login handler
   */
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      const response = await apiLogin(credentials);
      setUser(response.user);
      
      // Store user info in localStorage for backward compatibility
      localStorage.setItem('loggedInUser', JSON.stringify({
        name: response.user.first_name || response.user.username,
        email: response.user.email,
        id: response.user.id
      }));
      
      // Dispatch event for other components that might be listening
      window.dispatchEvent(new Event('userLoggedIn'));
    } catch (error) {
      const message = parseAuthError(error);
      throw new Error(message);
    }
  }, []);
  
  /**
   * Register handler
   */
  const register = useCallback(async (data: RegisterRequest) => {
    try {
      // Register the user
      await apiRegister(data);
      
      // Automatically log in after registration
      await login({
        username: data.username,
        password: data.password
      });
    } catch (error) {
      const message = parseAuthError(error);
      throw new Error(message);
    }
  }, [login]);
  
  /**
   * Logout handler
   */
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      localStorage.removeItem('loggedInUser');
      window.dispatchEvent(new Event('userLoggedOut'));
    }
  }, []);
  
  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    if (!hasStoredTokens()) {
      setUser(null);
      return;
    }
    
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        localStorage.setItem('loggedInUser', JSON.stringify({
          name: currentUser.first_name || currentUser.username,
          email: currentUser.email,
          id: currentUser.id
        }));
      }
    } catch {
      clearTokens();
      setUser(null);
      localStorage.removeItem('loggedInUser');
    }
  }, []);
  
  // Computed property for isAuthenticated
  const isAuthenticated = !!user;
  
  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// CUSTOM HOOK
// =============================================================================

/**
 * Hook to access authentication context
 * 
 * @throws Error if used outside of AuthProvider
 * @returns AuthContextType - Authentication state and methods
 * 
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
