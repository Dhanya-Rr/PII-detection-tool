/**
 * ExecutionConsole Component (Phase 7)
 * 
 * Displays real-time audit logs in a terminal-style console.
 * Provides enterprise-grade execution visibility with timestamped,
 * color-coded log entries.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Terminal, 
  Download, 
  Trash2, 
  Play,
  Pause,
  RefreshCw
} from "lucide-react";
import {
  fetchAuditLogs,
  streamAuditLogs,
  type AuditLogEntry,
} from "@/api";

interface ExecutionConsoleProps {
  projectId: string;
  jobId: string | null;
  autoScroll?: boolean;
  maxLines?: number;
  onLogsUpdate?: (logs: AuditLogEntry[]) => void;
}

// Color mapping for status indicators
const statusColors: Record<string, string> = {
  started: 'text-blue-400',
  processing: 'text-yellow-400',
  completed: 'text-green-400',
  error: 'text-red-400',
};

// Action display names
const actionDisplayNames: Record<string, string> = {
  job_started: 'Job Started',
  analysis_started: 'Analysis Started',
  analysis_completed: 'Analysis Completed',
  strategy_selected: 'Strategy Selected',
  masking_started: 'Masking Started',
  masking_completed: 'Masking Completed',
  validation_started: 'Validation Started',
  validation_completed: 'Validation Completed',
  job_completed: 'Job Completed',
  job_failed: 'Job Failed',
};

export const ExecutionConsole = ({
  projectId,
  jobId,
  autoScroll = true,
  maxLines = 500,
  onLogsUpdate,
}: ExecutionConsoleProps) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [jobStatus, setJobStatus] = useState<string>('pending');
  const scrollRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isPaused]);

  // Notify parent of log updates
  useEffect(() => {
    onLogsUpdate?.(logs);
  }, [logs, onLogsUpdate]);

  // Add a new log entry
  const addLog = useCallback((log: AuditLogEntry) => {
    setLogs(prev => {
      const newLogs = [...prev, log];
      // Trim logs if exceeding maxLines
      if (newLogs.length > maxLines) {
        return newLogs.slice(-maxLines);
      }
      return newLogs;
    });
  }, [maxLines]);

  // Handle job completion
  const handleComplete = useCallback((status: string) => {
    setJobStatus(status);
    setIsStreaming(false);
    console.log('[ExecutionConsole] Job completed with status:', status);
  }, []);

  // Handle streaming errors
  const handleError = useCallback((error: string) => {
    console.error('[ExecutionConsole] Stream error:', error);
    setIsStreaming(false);
    addLog({
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      action: 'stream_error',
      field: null,
      status: 'error',
      message: `Stream error: ${error}`,
    });
  }, [addLog]);

  // Start streaming logs
  const startStreaming = useCallback(() => {
    if (!projectId || !jobId) {
      console.warn('[ExecutionConsole] Cannot start streaming without projectId and jobId');
      return;
    }

    setIsStreaming(true);
    setJobStatus('running');

    const cleanup = streamAuditLogs(
      projectId,
      jobId,
      addLog,
      handleComplete,
      handleError
    );

    cleanupRef.current = cleanup;
  }, [projectId, jobId, addLog, handleComplete, handleError]);

  // Fetch existing logs (for viewing completed jobs)
  const fetchExistingLogs = useCallback(async () => {
    if (!projectId || !jobId) return;

    try {
      const response = await fetchAuditLogs(projectId, jobId);
      setLogs(response.logs);
      setJobStatus(response.status);
    } catch (error) {
      console.error('[ExecutionConsole] Failed to fetch logs:', error);
    }
  }, [projectId, jobId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Auto-start streaming when jobId changes
  useEffect(() => {
    if (jobId) {
      // First fetch any existing logs
      fetchExistingLogs().then(() => {
        // Then start streaming for live updates
        startStreaming();
      });
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [jobId, fetchExistingLogs, startStreaming]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Export logs as text file
  const exportLogs = useCallback(() => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.action}${log.field ? ` (${log.field})` : ''}: ${log.message}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masking-logs-${jobId || 'unknown'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs, jobId]);

  // Format log entry for display
  const formatLogEntry = (log: AuditLogEntry, index: number) => {
    const statusColor = statusColors[log.status] || 'text-gray-400';
    const actionName = actionDisplayNames[log.action] || log.action;

    return (
      <div
        key={index}
        className="font-mono text-sm py-1 px-2 hover:bg-secondary/30 transition-colors"
      >
        <span className="text-muted-foreground">[{log.timestamp}]</span>
        {' '}
        <span className={statusColor}>●</span>
        {' '}
        <span className="text-foreground">{actionName}</span>
        {log.field && (
          <span className="text-primary ml-2">({log.field})</span>
        )}
        <span className="text-muted-foreground ml-2">- {log.message}</span>
      </div>
    );
  };

  return (
    <Card className="glass-effect">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Execution Console</CardTitle>
            {isStreaming && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 animate-pulse">
                LIVE
              </Badge>
            )}
            {jobStatus === 'completed' && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                Completed
              </Badge>
            )}
            {jobStatus === 'failed' && (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                Failed
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              disabled={!isStreaming}
              title={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchExistingLogs}
              title="Refresh logs"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              title="Clear console"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportLogs}
              disabled={logs.length === 0}
              title="Export logs"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="bg-black/90 rounded-lg border border-border overflow-hidden"
        >
          <ScrollArea className="h-[400px] w-full">
            <div className="p-4">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 font-mono">
                  {jobId ? (
                    <div>
                      <p>Waiting for log entries...</p>
                      <p className="text-xs mt-2">Logs will appear here when the masking job starts</p>
                    </div>
                  ) : (
                    <div>
                      <p>No job selected</p>
                      <p className="text-xs mt-2">Start a masking job to see execution logs</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-0">
                  {logs.map((log, index) => formatLogEntry(log, index))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>{logs.length} log entries</span>
          <span>
            {autoScroll && !isPaused ? 'Auto-scroll enabled' : 'Auto-scroll paused'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutionConsole;
