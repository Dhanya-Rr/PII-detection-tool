/**
 * API Module Index
 * 
 * Re-exports all API utilities for convenient importing.
 * 
 * Usage:
 *   import { checkBackendHealth, apiGet, apiPost } from '@/api';
 *   import { login, logout, register } from '@/api';
 */

export {
  // Client utilities
  API_BASE_URL,
  getApiUrl,
  apiGet,
  apiPost,
  checkBackendHealth,
  
  // Types
  type HealthCheckResponse,
  type BackendStatus,
  type ApiError,
} from './client';

// Authentication exports
export {
  // Functions
  login,
  logout,
  register,
  getCurrentUser,
  refreshAccessToken,
  getAccessToken,
  getRefreshToken,
  storeTokens,
  clearTokens,
  hasStoredTokens,
  parseAuthError,
  
  // Types
  type User,
  type AuthTokens,
  type LoginRequest,
  type RegisterRequest,
  type LoginResponse,
  type RegisterResponse,
  type MeResponse,
  type AuthError,
} from './auth';

// Project Management exports (Phase 3)
export {
  // Functions
  fetchProjects,
  createProject,
  getProject,
  selectProject,
  deleteProject,
  getActiveProject,
  clearActiveProject,
  storeActiveProjectId,
  getStoredActiveProjectId,
  clearStoredActiveProjectId,
  parseProjectError,
  
  // Types
  type Project,
  type CreateProjectRequest,
  type ProjectListResponse,
  type ProjectResponse,
  type ActiveProjectResponse,
  type DeleteProjectResponse,
  type ProjectError,
} from './projects';

// Dashboard exports (Phase 4)
export {
  // Functions
  fetchDashboardData,
  fetchDashboardStats,
  fetchPIIDistribution,
  fetchMaskingMethods,
  fetchRecentActivity,
  parseDashboardError,
  
  // Constants
  EMPTY_DASHBOARD_DATA,
  
  // Types
  type DashboardStats,
  type PIIDistributionItem,
  type MaskingMethodItem,
  type ActivityItem,
  type DashboardData,
  type DashboardState,
} from './dashboard';

// Database Connection exports (Phase 4 - Safe Mode)
export {
  // Functions
  createDbConnection,
  testDbConnection,
  fetchDbTables,
  fetchTableData,
  parseDatabaseError,
  
  // Types
  type DatabaseType,
  type ConnectionStatus,
  type DatabaseConnectionData,
  type CreateDbConnectionRequest,
  type TestConnectionResponse,
  type TableMetadata,
  type FetchTablesResponse,
  type TableDataResponse,
  type DatabaseError,
} from './database';

// PII Scan exports (Phase 5 - Rule-Based Detection)
export {
  // Functions
  startPiiScan,
  fetchScanResults,
  aggregatePIIDistribution,
  parseScanError,
  
  // Types
  type StartScanResponse,
  type DetectedPIIField,
  type ScanResultsResponse,
  type PIITypeCount,
} from './piiScan';

// Masking exports (Phase 6 - Anonymization Engine)
export {
  // Functions
  listMaskingJobs,
  getMaskingJob,
  startMaskingJob,
  getMaskingJobResults,
  previewMasking,
  streamMaskingProgress,
  parseMaskingError,
  
  // Phase 7: Audit Logs
  fetchAuditLogs,
  streamAuditLogs,
  
  // Phase 8: Real Data Processing
  executeMaskingJob,
  exportMaskedData,
  downloadMaskedData,
  pushMaskedData,
  listMaskedDatasets,
  previewMaskedData,
  
  // Types
  type MaskingJobStatus,
  type MaskingFieldStatus,
  type MaskingStep,
  type MaskingField,
  type MaskingLog,
  type MaskingJob,
  type StartMaskingJobResponse,
  type MaskingProgressEvent,
  type StrategyAssignment,
  type MaskingFieldResult,
  type MaskingPreviewResponse,
  type FieldConfiguration,
  type AuditLogEntry,
  type AuditLogsResponse,
  // Phase 8 types
  type MaskedDatasetInfo,
  type ExecuteMaskingResponse,
  type PushMaskedDataResponse,
  type MaskedDataPreviewResponse,
} from './masking';

