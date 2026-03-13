import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  status: "initializing" | "running" | "completed";
  phase: string;
}

interface ExecutionLogProps {
  fieldName: string;
  method: "masking" | "anonymization" | "";
  technique: string;
  currentPhase: string;
  phaseProgress: Record<string, number>;
  isActive: boolean;
  isCompleted: boolean;
}

const generateLogEntries = (
  method: string,
  technique: string,
  fieldName: string
): LogEntry[] => {
  const algorithmName = method === "masking" 
    ? getAlgorithmForMasking(technique)
    : getAlgorithmForAnonymization(technique);
  
  const policyName = method === "masking" 
    ? "MASK-POLICY-ENT-2024" 
    : "ANON-POLICY-GDPR-2024";

  return [
    // Phase 1: Analysis
    { id: "1", phase: "analysis", message: `Field registration initiated: ${fieldName}`, status: "initializing", timestamp: "" },
    { id: "2", phase: "analysis", message: "PII sensitivity classification started", status: "running", timestamp: "" },
    { id: "3", phase: "analysis", message: "Scanning field metadata and data patterns", status: "running", timestamp: "" },
    { id: "4", phase: "analysis", message: "Sensitivity level resolved: Classified", status: "completed", timestamp: "" },
    
    // Phase 2: Strategy
    { id: "5", phase: "strategy", message: `Protection policy lookup initiated`, status: "initializing", timestamp: "" },
    { id: "6", phase: "strategy", message: `Policy matched: ${policyName}`, status: "running", timestamp: "" },
    { id: "7", phase: "strategy", message: `Protection category resolved: ${method === "masking" ? "Data Masking" : "Anonymization"}`, status: "running", timestamp: "" },
    { id: "8", phase: "strategy", message: `Technique selected: ${technique.charAt(0).toUpperCase() + technique.slice(1)}`, status: "running", timestamp: "" },
    { id: "9", phase: "strategy", message: "Strategy parameters validated", status: "completed", timestamp: "" },
    
    // Phase 3: Execution
    { id: "10", phase: "execution", message: `Algorithm parameters initialized: ${algorithmName}`, status: "initializing", timestamp: "" },
    { id: "11", phase: "execution", message: "Secure execution environment verified", status: "running", timestamp: "" },
    { id: "12", phase: "execution", message: "Memory isolation confirmed", status: "running", timestamp: "" },
    { id: "13", phase: "execution", message: `Algorithm ${algorithmName} execution in progress`, status: "running", timestamp: "" },
    { id: "14", phase: "execution", message: "Processing data records in secure context", status: "running", timestamp: "" },
    { id: "15", phase: "execution", message: "Transformation engine active", status: "running", timestamp: "" },
    { id: "16", phase: "execution", message: "Algorithm execution completed successfully", status: "completed", timestamp: "" },
    
    // Phase 4: Confirmation
    { id: "17", phase: "confirmation", message: "Transformation applied to field", status: "initializing", timestamp: "" },
    { id: "18", phase: "confirmation", message: "Verifying data integrity post-transformation", status: "running", timestamp: "" },
    { id: "19", phase: "confirmation", message: "Field locked with protection layer", status: "running", timestamp: "" },
    { id: "20", phase: "confirmation", message: "Secure processing confirmed", status: "completed", timestamp: "" },
    
    // Phase 5: Validation
    { id: "21", phase: "validation", message: "Validation checks running", status: "initializing", timestamp: "" },
    { id: "22", phase: "validation", message: "Re-identification risk assessment: Evaluating", status: "running", timestamp: "" },
    { id: "23", phase: "validation", message: "Compliance verification: GDPR, CCPA, HIPAA", status: "running", timestamp: "" },
    { id: "24", phase: "validation", message: "Data utility preservation check", status: "running", timestamp: "" },
    { id: "25", phase: "validation", message: "Re-identification risk: Reduced", status: "completed", timestamp: "" },
    { id: "26", phase: "validation", message: "Compliance checks: Passed", status: "completed", timestamp: "" },
    { id: "27", phase: "validation", message: "Data utility: Preserved", status: "completed", timestamp: "" },
    { id: "28", phase: "validation", message: `Field protection finalized: ${fieldName}`, status: "completed", timestamp: "" },
  ];
};

const getAlgorithmForMasking = (technique: string): string => {
  const algorithms: Record<string, string> = {
    "partial": "PARTIAL-MASK-256",
    "full": "FULL-REDACT-512",
    "character": "CHAR-SUBSTITUTE-128",
    "pattern": "PATTERN-PRESERVE-384",
    "tokenization": "TOKEN-VAULT-AES256",
    "hashing": "SHA256-HASH-512",
    "default": "MASK-STANDARD-256"
  };
  return algorithms[technique] || "MASK-STANDARD-256";
};

const getAlgorithmForAnonymization = (technique: string): string => {
  const algorithms: Record<string, string> = {
    "generalization": "K-ANON-GENERAL-512",
    "pseudonymization": "PSEUDO-HASH-SHA256",
    "tokenization": "TOKEN-VAULT-AES256",
    "suppression": "SUPPRESS-REDACT-128",
    "noise": "DIFFERENTIAL-PRIVACY-256",
    "default": "ANON-STANDARD-256"
  };
  return algorithms[technique] || "ANON-STANDARD-256";
};

const getPhaseIndex = (phase: string): number => {
  const phases = ["analysis", "strategy", "execution", "confirmation", "validation"];
  return phases.indexOf(phase);
};

export const ExecutionLog = ({
  fieldName,
  method,
  technique,
  currentPhase,
  phaseProgress,
  isActive,
  isCompleted
}: ExecutionLogProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [visibleLogs, setVisibleLogs] = useState<LogEntry[]>([]);
  const [allLogs] = useState(() => generateLogEntries(method, technique, fieldName));
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastLogIndexRef = useRef(0);

  useEffect(() => {
    if (!isActive && !isCompleted) {
      setVisibleLogs([]);
      lastLogIndexRef.current = 0;
      return;
    }

    const currentPhaseIndex = getPhaseIndex(currentPhase);
    const phases = ["analysis", "strategy", "execution", "confirmation", "validation"];
    
    // Calculate which logs should be visible based on phase progress
    let targetLogCount = 0;
    
    for (let i = 0; i <= currentPhaseIndex; i++) {
      const phaseName = phases[i];
      const phaseLogs = allLogs.filter(log => log.phase === phaseName);
      const progress = phaseProgress[phaseName] || 0;
      
      if (i < currentPhaseIndex) {
        // Previous phases - all logs visible
        targetLogCount += phaseLogs.length;
      } else {
        // Current phase - proportional to progress
        const logsToShow = Math.ceil((progress / 100) * phaseLogs.length);
        targetLogCount += logsToShow;
      }
    }

    // Add logs one by one with delay for smooth reveal
    if (targetLogCount > lastLogIndexRef.current) {
      const newIndex = lastLogIndexRef.current + 1;
      const now = new Date();
      const timestamp = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
      }) + '.' + now.getMilliseconds().toString().padStart(3, '0');
      
      const newLog = { ...allLogs[newIndex - 1], timestamp };
      
      setVisibleLogs(prev => [...prev, newLog]);
      lastLogIndexRef.current = newIndex;
    }

    // Show all logs if completed
    if (isCompleted && visibleLogs.length < allLogs.length) {
      const now = new Date();
      const baseTimestamp = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
      }) + '.' + now.getMilliseconds().toString().padStart(3, '0');
      const remainingLogs = allLogs.slice(visibleLogs.length).map(log => ({
        ...log,
        timestamp: baseTimestamp
      }));
      setVisibleLogs(prev => [...prev, ...remainingLogs]);
      lastLogIndexRef.current = allLogs.length;
    }
  }, [currentPhase, phaseProgress, isActive, isCompleted, allLogs, visibleLogs.length]);

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLogs]);

  const getStatusColor = (status: LogEntry["status"]) => {
    switch (status) {
      case "initializing": return "text-yellow-500";
      case "running": return "text-primary";
      case "completed": return "text-accent";
      default: return "text-muted-foreground";
    }
  };

  const getStatusIndicator = (status: LogEntry["status"]) => {
    switch (status) {
      case "initializing": return "○";
      case "running": return "◐";
      case "completed": return "●";
      default: return "○";
    }
  };

  if (!isActive && !isCompleted && visibleLogs.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3">
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 rounded bg-secondary/50 hover:bg-secondary/70 transition-colors">
        {isOpen ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        )}
        <Terminal className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Execution Log
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {visibleLogs.length} / {allLogs.length} entries
        </span>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div 
          ref={scrollRef}
          className="mt-2 max-h-48 overflow-y-auto bg-background/80 rounded border border-border/50 p-2 font-mono text-[10px]"
        >
          {visibleLogs.map((log, index) => (
            <div 
              key={log.id}
              className={cn(
                "flex items-start gap-2 py-1 px-1 rounded transition-all duration-300",
                index === visibleLogs.length - 1 && isActive && "animate-pulse bg-primary/5"
              )}
              style={{
                animationDelay: `${index * 50}ms`,
                opacity: 1,
                transform: 'translateY(0)'
              }}
            >
              <span className="text-muted-foreground/60 shrink-0 w-20">
                {log.timestamp}
              </span>
              <span className={cn("shrink-0", getStatusColor(log.status))}>
                {getStatusIndicator(log.status)}
              </span>
              <span className="text-muted-foreground/50 shrink-0 w-16 uppercase">
                [{log.phase.slice(0, 6)}]
              </span>
              <span className={cn(
                "flex-1",
                log.status === "completed" ? "text-foreground" : "text-muted-foreground"
              )}>
                {log.message}
              </span>
            </div>
          ))}
          
          {isActive && !isCompleted && (
            <div className="flex items-center gap-2 py-1 px-1 text-muted-foreground/50">
              <span className="w-20" />
              <span className="animate-pulse">▌</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
