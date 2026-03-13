/**
 * Project Context
 * 
 * Manages project state throughout the application.
 * Uses Django backend API for all project operations.
 * 
 * Phase 3: Real multi-project support with backend integration.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchProjects,
  createProject as createProjectApi,
  selectProject as selectProjectApi,
  deleteProject as deleteProjectApi,
  getActiveProject,
  parseProjectError,
  type Project,
  type CreateProjectRequest,
} from "@/api/projects";

// Re-export Project type for convenience
export type { Project };

/**
 * Field detected as PII during scanning
 */
export interface DetectedField {
  id: string;
  field_name: string;
  field_type: string;
  confidence: number;
  table_name: string | null;
}

/**
 * Statistics from PII scanning
 */
interface ScanStats {
  totalScans: number;
  piiFieldsFound: number;
  tablesScanned: number;
}

/**
 * Project context interface
 */
interface ProjectContextType {
  // Project state
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  
  // Project actions
  setCurrentProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project | null>;
  selectProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<boolean>;
  clearError: () => void;
  
  // Detection state (to be integrated with backend in Phase 4)
  detectedFields: DetectedField[];
  setDetectedFields: (fields: DetectedField[]) => void;
  
  // Database connection state (to be integrated with backend in Phase 3)
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  connectionId: number | null;
  setConnectionId: (id: number | null) => void;
  
  // Scan statistics
  scanStats: ScanStats;
  setScanStats: (stats: ScanStats) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  // Project state
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Detection state (temporary - will be moved to backend in Phase 4)
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  
  // Database connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<number | null>(null);
  
  // Scan statistics
  const [scanStats, setScanStats] = useState<ScanStats>({
    totalScans: 0,
    piiFieldsFound: 0,
    tablesScanned: 0,
  });
  
  const { user, isAuthenticated } = useAuth();

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Set the current project (wrapper to allow external setting)
   */
  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectState(project);
  }, []);

  /**
   * Load all projects for the authenticated user from the backend
   */
  const loadProjects = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProjects([]);
      setCurrentProjectState(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch projects from backend
      const response = await fetchProjects();
      setProjects(response.projects);
      
      // Find and set the active project
      const activeProject = response.projects.find(p => p.is_active);
      if (activeProject) {
        setCurrentProjectState(activeProject);
      } else if (response.projects.length > 0) {
        // If no active project but projects exist, try to get active from backend
        try {
          const activeResponse = await getActiveProject();
          if (activeResponse.active_project) {
            setCurrentProjectState(activeResponse.active_project);
          }
        } catch {
          // No active project set, that's okay
        }
      }
    } catch (err) {
      const errorMessage = parseProjectError(err);
      console.error('Error loading projects:', errorMessage);
      setError(errorMessage);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Create a new project
   */
  const createProject = useCallback(async (
    name: string,
    description?: string
  ): Promise<Project | null> => {
    if (!isAuthenticated) {
      setError('You must be logged in to create a project');
      return null;
    }
    
    setError(null);
    
    try {
      const data: CreateProjectRequest = { name };
      if (description) {
        data.description = description;
      }
      
      const response = await createProjectApi(data);
      const newProject = response.project;
      
      // Add to local state
      setProjects(prev => [newProject, ...prev]);
      
      // If this is the first project or it's marked as active, set it as current
      if (newProject.is_active || projects.length === 0) {
        setCurrentProjectState(newProject);
      }
      
      return newProject;
    } catch (err) {
      const errorMessage = parseProjectError(err);
      console.error('Error creating project:', errorMessage);
      setError(errorMessage);
      return null;
    }
  }, [isAuthenticated, projects.length]);

  /**
   * Select a project as the active project
   */
  const selectProject = useCallback(async (projectId: string) => {
    if (!isAuthenticated) {
      setError('You must be logged in to select a project');
      return;
    }
    
    setError(null);
    
    try {
      const response = await selectProjectApi(projectId);
      const selectedProject = response.project;
      
      // Update current project
      setCurrentProjectState(selectedProject);
      
      // Update the projects list to reflect the new active state
      setProjects(prev => prev.map(p => ({
        ...p,
        is_active: p.id === projectId,
      })));
      
      // Reset project-specific state when switching projects
      setDetectedFields([]);
      setScanStats({
        totalScans: 0,
        piiFieldsFound: 0,
        tablesScanned: 0,
      });
      setIsConnected(false);
      setConnectionId(null);
    } catch (err) {
      const errorMessage = parseProjectError(err);
      console.error('Error selecting project:', errorMessage);
      setError(errorMessage);
    }
  }, [isAuthenticated]);

  /**
   * Delete a project
   */
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('You must be logged in to delete a project');
      return false;
    }
    
    setError(null);
    
    try {
      await deleteProjectApi(projectId);
      
      // Remove from local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      // If we deleted the current project, clear it
      if (currentProject?.id === projectId) {
        setCurrentProjectState(null);
        setDetectedFields([]);
        setScanStats({
          totalScans: 0,
          piiFieldsFound: 0,
          tablesScanned: 0,
        });
        setIsConnected(false);
        setConnectionId(null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = parseProjectError(err);
      console.error('Error deleting project:', errorMessage);
      setError(errorMessage);
      return false;
    }
  }, [isAuthenticated, currentProject?.id]);

  // Load projects when user authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadProjects();
    } else {
      // Clear all state when user logs out
      setProjects([]);
      setCurrentProjectState(null);
      setDetectedFields([]);
      setIsConnected(false);
      setConnectionId(null);
      setScanStats({
        totalScans: 0,
        piiFieldsFound: 0,
        tablesScanned: 0,
      });
      setError(null);
    }
  }, [isAuthenticated, user?.id]);

  return (
    <ProjectContext.Provider value={{
      // Project state
      currentProject,
      projects,
      isLoading,
      error,
      
      // Project actions
      setCurrentProject,
      loadProjects,
      createProject,
      selectProject,
      deleteProject,
      clearError,
      
      // Detection state
      detectedFields,
      setDetectedFields,
      
      // Connection state
      isConnected,
      setIsConnected,
      connectionId,
      setConnectionId,
      
      // Scan stats
      scanStats,
      setScanStats,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
