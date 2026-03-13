/**
 * MaskingProgress Component (Phase 6 & 8)
 * 
 * Displays real-time masking progress from the backend via SSE.
 * Shows animated progress steps, field-by-field status, and final results.
 * 
 * Phase 8 additions:
 * - Execute real data processing
 * - Export masked data (CSV/JSON)
 * - Push masked data to database
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Shield,
  Search,
  Settings,
  Eye,
  FileCheck,
  Download,
  Database,
  Play,
  FileJson,
  FileSpreadsheet,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import {
  startMaskingJob,
  streamMaskingProgress,
  getMaskingJobResults,
  parseMaskingError,
  executeMaskingJob,
  downloadMaskedData,
  pushMaskedData,
  listMaskedDatasets,
  previewMaskedData,
  type MaskingProgressEvent,
  type MaskingFieldResult,
  type MaskedDatasetInfo,
} from "@/api";
import { useProject } from "@/contexts/ProjectContext";

// Progress step interface
interface ProgressStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'error';
  message?: string;
}

// Field processing status
interface FieldStatus {
  name: string;
  piiType: string;
  strategy: string;
  strategyDisplay?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  originalSample?: string;
  maskedSample?: string;
}

interface MaskingProgressProps {
  onComplete?: (results: MaskingFieldResult[]) => void;
  onError?: (error: string) => void;
  onJobStarted?: (jobId: string) => void;
  tableName?: string;
}

export const MaskingProgress = ({ onComplete, onError, onJobStarted, tableName }: MaskingProgressProps) => {
  const { currentProject } = useProject();
  const [isStarted, setIsStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldStatus[]>([]);
  const [results, setResults] = useState<MaskingFieldResult[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);
  
  // Real data processing results from SSE auto-execution
  const [realDataResult, setRealDataResult] = useState<{
    tables_processed: number;
    rows_processed: number;
    datasets: Array<{ table_name: string; row_count: number }>;
  } | null>(null);

  // Progress steps
  const [steps, setSteps] = useState<ProgressStep[]>([
    { id: 'analysis', label: 'Analyzing Fields', icon: <Search className="h-4 w-4" />, status: 'pending' },
    { id: 'strategy_selection', label: 'Selecting Strategies', icon: <Settings className="h-4 w-4" />, status: 'pending' },
    { id: 'masking', label: 'Applying Masking', icon: <Shield className="h-4 w-4" />, status: 'pending' },
    { id: 'validation', label: 'Validating Results', icon: <Eye className="h-4 w-4" />, status: 'pending' },
    { id: 'completed', label: 'Completed', icon: <FileCheck className="h-4 w-4" />, status: 'pending' },
  ]);

  // Update step status
  const updateStepStatus = useCallback((stepId: string, status: ProgressStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        return { ...step, status, message };
      }
      // Mark previous steps as completed
      const stepIndex = prev.findIndex(s => s.id === stepId);
      const currentIndex = prev.findIndex(s => s.id === step.id);
      if (currentIndex < stepIndex && status === 'active') {
        return { ...step, status: 'completed' };
      }
      return step;
    }));
  }, []);

  // Handle progress events from SSE
  const handleProgress = useCallback((event: MaskingProgressEvent) => {
    console.log('[MaskingProgress] Progress event:', event.step, event.field || '', event.status || '');
    
    // Update overall progress
    setOverallProgress(event.progress || 0);
    setCurrentStep(event.step);
    setCurrentMessage(event.message);

    // Handle each step type
    switch (event.step) {
      case 'analysis':
        updateStepStatus('analysis', 'active', event.message);
        break;
        
      case 'strategy_selection':
        // Mark analysis as done, strategy selection as active
        updateStepStatus('analysis', 'completed');
        updateStepStatus('strategy_selection', 'active', event.message);
        
        // When strategies are assigned, initialize the fields list
        if (event.strategies && event.strategies.length > 0) {
          console.log('[MaskingProgress] Initializing fields from strategies:', event.strategies);
          setFields(event.strategies.map(s => ({
            name: s.field,
            piiType: s.pii_type,
            strategy: s.strategy,
            strategyDisplay: (s as { strategy_display?: string }).strategy_display || s.strategy,
            status: 'pending' as const,
          })));
        }
        break;
        
      case 'masking':
        // Mark strategy selection as done, masking as active
        updateStepStatus('strategy_selection', 'completed');
        updateStepStatus('masking', 'active', event.message);
        
        // Update individual field status
        if (event.field) {
          setFields(prev => {
            // If no fields yet, create from the event
            if (prev.length === 0 && event.pii_type && event.strategy) {
              return [{
                name: event.field!,
                piiType: event.pii_type,
                strategy: event.strategy,
                strategyDisplay: event.strategy_display || event.strategy,
                status: event.status === 'completed' ? 'completed' as const : 'processing' as const,
                originalSample: event.original_sample,
                maskedSample: event.masked_sample,
              }];
            }
            
            // Check if field already exists
            const fieldExists = prev.some(f => f.name === event.field);
            
            if (!fieldExists && event.pii_type && event.strategy) {
              // Add new field
              return [...prev, {
                name: event.field!,
                piiType: event.pii_type,
                strategy: event.strategy,
                strategyDisplay: event.strategy_display || event.strategy,
                status: event.status === 'completed' ? 'completed' as const : 'processing' as const,
                originalSample: event.original_sample,
                maskedSample: event.masked_sample,
              }];
            }
            
            // Update existing field
            return prev.map(f => {
              if (f.name === event.field) {
                return {
                  ...f,
                  status: event.status === 'completed' ? 'completed' as const : 'processing' as const,
                  originalSample: event.original_sample || f.originalSample,
                  maskedSample: event.masked_sample || f.maskedSample,
                };
              }
              return f;
            });
          });
        }
        break;
        
      case 'validation':
        // Mark masking as done, validation as active
        updateStepStatus('masking', 'completed');
        updateStepStatus('validation', 'active', event.message);
        break;
    }
  }, [updateStepStatus]);

  // Handle completion
  const handleComplete = useCallback(async (event: MaskingProgressEvent) => {
    console.log('[MaskingProgress] Complete event:', event);
    
    // Mark all steps as completed
    updateStepStatus('validation', 'completed');
    updateStepStatus('completed', 'completed', event.message);
    setOverallProgress(100);
    setIsComplete(true);
    
    // Capture real data processing results if present (from auto-execution)
    if (event.real_data_processed && event.tables_processed !== undefined) {
      console.log('[MaskingProgress] Real data processed:', event.rows_processed, 'rows');
      setRealDataResult({
        tables_processed: event.tables_processed,
        rows_processed: event.rows_processed || 0,
        datasets: event.datasets || [],
      });
    }
    
    // If the event includes results, use them directly
    if (event.results && event.results.length > 0) {
      console.log('[MaskingProgress] Using results from SSE event:', event.results.length);
      setResults(event.results);
      
      // Also mark all fields as completed
      setFields(prev => prev.map(f => ({ ...f, status: 'completed' as const })));
      
      onComplete?.(event.results);
      
      // Show appropriate message based on real data processing
      if (event.real_data_processed) {
        toast.success(`Masked ${event.rows_processed} rows across ${event.tables_processed} tables!`);
      } else {
        toast.success(`Masking completed! ${event.results.length} fields processed.`);
      }
    } 
    // Otherwise, fetch results from the API
    else if (jobId && currentProject?.id) {
      console.log('[MaskingProgress] Fetching results from API...');
      try {
        const resultData = await getMaskingJobResults(currentProject.id, jobId);
        console.log('[MaskingProgress] Results fetched:', resultData.results?.length);
        
        if (resultData.results) {
          setResults(resultData.results);
          onComplete?.(resultData.results);
          
          if (event.real_data_processed) {
            toast.success(`Masked ${event.rows_processed} rows! Ready for export.`);
          } else {
            toast.success(`Masking completed! ${resultData.results.length} fields processed.`);
          }
        }
      } catch (err) {
        console.error('[MaskingProgress] Failed to fetch results:', err);
        toast.warning('Masking completed, but failed to fetch detailed results.');
      }
    } else {
      if (event.real_data_processed) {
        toast.success(`Masked ${event.rows_processed} rows! Ready for export.`);
      } else {
        toast.success('Masking completed successfully!');
      }
    }
  }, [updateStepStatus, onComplete, jobId, currentProject?.id]);

  // Handle error
  const handleError = useCallback((errorMsg: string) => {
    console.error('[MaskingProgress] Error:', errorMsg);
    setError(errorMsg);
    setSteps(prev => prev.map(step => 
      step.status === 'active' ? { ...step, status: 'error' } : step
    ));
    onError?.(errorMsg);
    toast.error(errorMsg);
  }, [onError]);

  // Start the masking job
  const startMasking = useCallback(async () => {
    if (!currentProject?.id) {
      toast.error('No project selected');
      return;
    }

    console.log('[MaskingProgress] Starting masking for project:', currentProject.id, 'table:', tableName);
    
    setIsStarted(true);
    setError(null);
    setOverallProgress(0);
    setFields([]); // Reset fields
    setResults([]); // Reset results
    updateStepStatus('analysis', 'active', 'Starting masking job...');

    try {
      // Step 1: Call POST /masking/start/ to create the job
      console.log('[MaskingProgress] Calling startMaskingJob API...');
      const response = await startMaskingJob(currentProject.id, tableName);
      
      console.log('[MaskingProgress] Job created:', response);
      setJobId(response.job_id);
      
      // Notify parent of job start (for ExecutionConsole integration)
      onJobStarted?.(response.job_id);
      
      toast.info(`Starting masking for ${response.total_fields} fields...`);

      // Step 2: Connect to SSE stream for real-time progress
      console.log('[MaskingProgress] Connecting to SSE stream:', response.stream_url);
      const cleanup = streamMaskingProgress(
        currentProject.id,
        response.job_id,
        handleProgress,
        handleComplete,
        handleError
      );
      
      cleanupRef.current = cleanup;

    } catch (err) {
      console.error('[MaskingProgress] Failed to start masking:', err);
      const errorMsg = parseMaskingError(err);
      handleError(errorMsg);
    }
  }, [currentProject?.id, tableName, handleProgress, handleComplete, handleError, updateStepStatus, onJobStarted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Get step icon with status color
  const getStepIcon = (step: ProgressStep) => {
    if (step.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (step.status === 'active') {
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }
    if (step.status === 'error') {
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
    return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/50" />;
  };

  return (
    <div className="space-y-6">
      {/* Start Button (only shown before starting) */}
      {!isStarted && (
        <Card className="glass-effect">
          <CardContent className="py-8 text-center">
            <Shield className="h-16 w-16 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ready to Apply Masking</h3>
            <p className="text-muted-foreground mb-6">
              Click the button below to start the masking process. 
              Progress will be shown in real-time.
            </p>
            <Button onClick={startMasking} size="lg" className="gradient-primary">
              <Shield className="mr-2 h-5 w-5" />
              Start Masking
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress Steps */}
      {isStarted && (
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Masking Progress
            </CardTitle>
            <CardDescription>
              {currentMessage || 'Processing your data...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>

            {/* Step Indicators */}
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    step.status === 'active' ? 'bg-primary/10 border border-primary/30' :
                    step.status === 'completed' ? 'bg-green-500/10' :
                    step.status === 'error' ? 'bg-destructive/10' :
                    'bg-secondary/30'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1">
                    <span className={`font-medium ${
                      step.status === 'active' ? 'text-primary' :
                      step.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                      step.status === 'error' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {step.label}
                    </span>
                    {step.message && step.status === 'active' && (
                      <p className="text-xs text-muted-foreground mt-0.5">{step.message}</p>
                    )}
                  </div>
                  {step.status === 'completed' && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      Done
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => {
                    setIsStarted(false);
                    setError(null);
                    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Field Processing Status */}
      {isStarted && fields.length > 0 && (
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-lg">Field Status</CardTitle>
            <CardDescription>
              {fields.filter(f => f.status === 'completed').length} of {fields.length} fields processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-auto">
              {fields.map((field, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border transition-all ${
                    field.status === 'processing' ? 'border-primary bg-primary/5' :
                    field.status === 'completed' ? 'border-green-500/50 bg-green-500/5' :
                    'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {field.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {field.status === 'processing' && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                      {field.status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                      <span className="font-mono text-sm">{field.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{field.piiType}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {field.strategyDisplay || field.strategy.replace('_mask', '').replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Show sample transformation for completed fields */}
                  {field.status === 'completed' && field.originalSample && field.maskedSample && (
                    <div className="mt-2 pt-2 border-t text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Sample:</span>
                        <code className="text-red-500 line-through">{field.originalSample}</code>
                        <span className="text-muted-foreground">→</span>
                        <code className="text-green-500">{field.maskedSample}</code>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Summary */}
      {isComplete && results.length > 0 && (
        <CompletionSummary 
          results={results} 
          jobId={jobId} 
          projectId={currentProject?.id}
          initialExecutionResult={realDataResult}
        />
      )}
    </div>
  );
};

// =============================================================================
// Completion Summary Component with Real Data Processing
// =============================================================================

interface CompletionSummaryProps {
  results: MaskingFieldResult[];
  jobId: string | null;
  projectId: string | undefined;
  initialExecutionResult?: {
    tables_processed: number;
    rows_processed: number;
    datasets: Array<{ table_name: string; row_count: number }>;
  } | null;
}

const CompletionSummary = ({ results, jobId, projectId, initialExecutionResult }: CompletionSummaryProps) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  // If we have initial result from SSE, mark as already executed
  const [executionComplete, setExecutionComplete] = useState(!!initialExecutionResult);
  const [executionResult, setExecutionResult] = useState<{
    tables_processed: number;
    rows_processed: number;
    datasets: Array<{ table_name: string; row_count: number }>;
  } | null>(initialExecutionResult || null);
  const [previewData, setPreviewData] = useState<Array<{
    table_name: string;
    columns: string[];
    rows: Record<string, unknown>[];
    total_rows: number;
  }> | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Auto-fetch preview if we already have execution result
  useEffect(() => {
    if (initialExecutionResult && projectId && jobId && !previewData) {
      previewMaskedData(projectId, jobId)
        .then((preview) => setPreviewData(preview.tables))
        .catch((err) => console.warn('Failed to auto-fetch preview:', err));
    }
  }, [initialExecutionResult, projectId, jobId, previewData]);

  // Execute masking on real database data
  const handleExecuteRealData = async () => {
    if (!projectId || !jobId) {
      toast.error('Missing project or job information');
      return;
    }

    setIsExecuting(true);
    toast.info('Processing real database records...');

    try {
      const result = await executeMaskingJob(projectId, jobId);
      
      if (result.status === 'completed') {
        setExecutionComplete(true);
        setExecutionResult({
          tables_processed: result.tables_processed,
          rows_processed: result.rows_processed,
          datasets: result.datasets,
        });
        toast.success(`Masked ${result.rows_processed} rows across ${result.tables_processed} tables!`);
        
        // Fetch preview of masked data
        try {
          const preview = await previewMaskedData(projectId, jobId);
          setPreviewData(preview.tables);
        } catch (err) {
          console.warn('Failed to fetch preview:', err);
        }
      } else {
        toast.error('Execution failed. Check the console for details.');
      }
    } catch (err) {
      console.error('Execution error:', err);
      toast.error(parseMaskingError(err));
    } finally {
      setIsExecuting(false);
    }
  };

  // Export masked data
  const handleExport = async (format: 'csv' | 'json') => {
    if (!projectId || !jobId) {
      toast.error('Missing project or job information');
      return;
    }

    setIsExporting(true);
    toast.info(`Preparing ${format.toUpperCase()} export...`);

    try {
      await downloadMaskedData(projectId, jobId, format);
      toast.success(`Masked data exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(parseMaskingError(err));
    } finally {
      setIsExporting(false);
    }
  };

  // Push masked data to database
  const handlePushToDatabase = async (mode: 'update' | 'insert') => {
    if (!projectId || !jobId) {
      toast.error('Missing project or job information');
      return;
    }

    const confirmMsg = mode === 'update' 
      ? 'This will UPDATE the original table with masked values. Are you sure?'
      : 'This will create a NEW table with the _masked suffix. Continue?';
    
    if (!confirm(confirmMsg)) {
      return;
    }

    setIsPushing(true);
    toast.info(`Pushing masked data to database (${mode} mode)...`);

    try {
      const result = await pushMaskedData(projectId, jobId, mode);
      
      if (result.status === 'completed') {
        toast.success(`Database updated! ${result.rows_affected} rows affected across ${result.tables_updated} tables.`);
      } else {
        toast.error('Push operation failed. Check the console for details.');
      }
    } catch (err) {
      console.error('Push error:', err);
      toast.error(parseMaskingError(err));
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <Card className="glass-effect border-green-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-6 w-6" />
          {executionComplete ? 'Real Data Processing Complete!' : 'Configuration Complete!'}
        </CardTitle>
        <CardDescription>
          {executionComplete 
            ? `Processed ${executionResult?.rows_processed || 0} rows across ${executionResult?.tables_processed || 0} tables`
            : `Configured masking for ${results.length} fields`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Results summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{results.length}</div>
              <div className="text-xs text-muted-foreground">Fields Configured</div>
            </div>
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {executionComplete ? executionResult?.rows_processed || 0 : '—'}
              </div>
              <div className="text-xs text-muted-foreground">Rows Processed</div>
            </div>
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">
                {new Set(results.map(r => r.table)).size}
              </div>
              <div className="text-xs text-muted-foreground">Tables</div>
            </div>
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {new Set(results.map(r => r.strategy)).size}
              </div>
              <div className="text-xs text-muted-foreground">Strategies Used</div>
            </div>
          </div>

          {/* Step 1: Execute Real Data Processing */}
          {!executionComplete && (
            <div className="p-4 bg-primary/5 border border-primary/30 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Step 1: Process Real Data
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Apply the configured masking techniques to actual database records.
                This will read data from your connected database and apply transformations.
              </p>
              <Button 
                onClick={handleExecuteRealData} 
                disabled={isExecuting}
                className="gradient-primary"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Process Real Database Records
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Preview of Masked Data */}
          {executionComplete && previewData && previewData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div 
                className="p-3 bg-secondary/30 flex items-center justify-between cursor-pointer"
                onClick={() => setShowPreview(!showPreview)}
              >
                <span className="font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview Masked Data
                </span>
                <Badge variant="secondary">{previewData[0].total_rows} rows</Badge>
              </div>
              {showPreview && (
                <div className="p-4 max-h-[300px] overflow-auto">
                  {previewData.map((table, idx) => (
                    <div key={idx} className="mb-4">
                      <h5 className="font-mono text-sm mb-2 text-muted-foreground">
                        {table.table_name}
                      </h5>
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-secondary/50">
                            {table.columns.map((col, i) => (
                              <th key={i} className="p-2 text-left border">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.slice(0, 5).map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-secondary/20">
                              {table.columns.map((col, colIdx) => (
                                <td key={colIdx} className="p-2 border font-mono">
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {table.total_rows > 5 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Showing 5 of {table.total_rows} rows
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Export or Push (only after execution) */}
          {executionComplete && (
            <div className="space-y-4">
              {/* Export Options */}
              <div className="p-4 bg-blue-500/5 border border-blue-500/30 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-500" />
                  Step 2a: Export Masked Data
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Download the masked dataset as a file for offline use or sharing.
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('csv')}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                    )}
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('json')}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileJson className="mr-2 h-4 w-4" />
                    )}
                    Export JSON
                  </Button>
                </div>
              </div>

              {/* Push to Database Options */}
              <div className="p-4 bg-orange-500/5 border border-orange-500/30 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-orange-500" />
                  Step 2b: Push to Database
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Write the masked data back to your database. Choose to update the original table
                  or create a new table with masked values.
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handlePushToDatabase('insert')}
                    disabled={isPushing}
                    className="border-orange-500/50 hover:bg-orange-500/10"
                  >
                    {isPushing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="mr-2 h-4 w-4" />
                    )}
                    Create New Masked Table
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handlePushToDatabase('update')}
                    disabled={isPushing}
                  >
                    {isPushing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Update Original Table
                  </Button>
                </div>
                <p className="text-xs text-destructive mt-2">
                  ⚠️ Warning: Updating the original table is irreversible!
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MaskingProgress;
