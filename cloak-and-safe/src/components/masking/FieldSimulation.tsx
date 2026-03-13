import { useEffect, useState } from "react";
import { Shield, Lock, CheckCircle2, Activity, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExecutionLog } from "./ExecutionLog";

interface FieldSimulationProps {
  fieldName: string;
  method: "masking" | "anonymization" | "";
  technique: string;
  isActive: boolean;
  onComplete: () => void;
}

type Phase = "analysis" | "strategy" | "execution" | "confirmation" | "validation";

const getSensitivityLevel = (fieldName: string): "Low" | "Medium" | "High" => {
  const highSensitivity = ["ssn", "aadhaar", "passport", "credit_card", "bank_account"];
  const mediumSensitivity = ["email", "phone", "address", "dob", "date_of_birth"];
  
  const normalizedName = fieldName.toLowerCase().replace(/[_\s-]/g, "");
  
  if (highSensitivity.some(f => normalizedName.includes(f))) return "High";
  if (mediumSensitivity.some(f => normalizedName.includes(f))) return "Medium";
  return "Low";
};

const getAlgorithmName = (method: string, technique: string): string => {
  if (method === "masking") {
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
  } else {
    const algorithms: Record<string, string> = {
      "generalization": "K-ANON-GENERAL-512",
      "pseudonymization": "PSEUDO-HASH-SHA256",
      "tokenization": "TOKEN-VAULT-AES256",
      "suppression": "SUPPRESS-REDACT-128",
      "noise": "DIFFERENTIAL-PRIVACY-256",
      "default": "ANON-STANDARD-256"
    };
    return algorithms[technique] || "ANON-STANDARD-256";
  }
};

export const FieldSimulation = ({ 
  fieldName, 
  method, 
  technique,
  isActive,
  onComplete 
}: FieldSimulationProps) => {
  const [phase, setPhase] = useState<Phase>("analysis");
  const [phaseProgress, setPhaseProgress] = useState({
    analysis: 0,
    strategy: 0,
    execution: 0,
    confirmation: 0,
    validation: 0
  });
  const [isCompleted, setIsCompleted] = useState(false);
  const [recordsProcessed, setRecordsProcessed] = useState(0);

  useEffect(() => {
    if (!isActive || isCompleted) return;

    // Longer timing for more substantial simulation (intentionally long-running)
    const baseTime = 1200 + Math.random() * 600;
    const phaseTimings = {
      analysis: baseTime * 1.0,
      strategy: baseTime * 1.3,
      execution: baseTime * 2.0,
      confirmation: baseTime * 1.0,
      validation: baseTime * 1.2
    };

    const phases: Phase[] = ["analysis", "strategy", "execution", "confirmation", "validation"];

    const runPhase = (phaseName: Phase, duration: number) => {
      return new Promise<void>((resolve) => {
        const steps = 25; // More granular steps
        const stepDuration = duration / steps;
        let currentStep = 0;

        const interval = setInterval(() => {
          currentStep++;
          setPhaseProgress(prev => ({
            ...prev,
            [phaseName]: (currentStep / steps) * 100
          }));

          if (phaseName === "execution") {
            setRecordsProcessed(prev => prev + Math.floor(Math.random() * 50 + 20));
          }

          if (currentStep >= steps) {
            clearInterval(interval);
            resolve();
          }
        }, stepDuration);
      });
    };

    const runAllPhases = async () => {
      for (const phaseName of phases) {
        setPhase(phaseName);
        await runPhase(phaseName, phaseTimings[phaseName]);
      }
      setIsCompleted(true);
      onComplete();
    };

    runAllPhases();
  }, [isActive, isCompleted, onComplete]);

  const sensitivityLevel = getSensitivityLevel(fieldName);
  const algorithmName = getAlgorithmName(method, technique);

  const phaseLabels: Record<Phase, string> = {
    analysis: "Analyzing Field",
    strategy: "Resolving Strategy",
    execution: "Executing Algorithm",
    confirmation: "Confirming Security",
    validation: "Validating Compliance"
  };

  const getPhaseStatus = (phaseName: Phase): "pending" | "active" | "complete" => {
    const phases: Phase[] = ["analysis", "strategy", "execution", "confirmation", "validation"];
    const currentIndex = phases.indexOf(phase);
    const phaseIndex = phases.indexOf(phaseName);
    
    if (isCompleted || phaseProgress[phaseName] >= 100) return "complete";
    if (phaseIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className={cn(
      "rounded-lg border p-4 transition-all duration-300",
      isCompleted ? "border-accent/50 bg-accent/5" : isActive ? "border-primary/50 bg-primary/5" : "border-border/50 bg-secondary/20"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <Lock className="w-4 h-4 text-accent" />
          ) : isActive ? (
            <Activity className="w-4 h-4 text-primary animate-pulse" />
          ) : (
            <Shield className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">{fieldName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded font-medium uppercase",
            sensitivityLevel === "High" && "bg-destructive/20 text-destructive",
            sensitivityLevel === "Medium" && "bg-yellow-500/20 text-yellow-600",
            sensitivityLevel === "Low" && "bg-accent/20 text-accent"
          )}>
            {sensitivityLevel}
          </span>
          {isCompleted && <CheckCircle2 className="w-4 h-4 text-accent" />}
        </div>
      </div>

      {/* Phase Indicators */}
      <div className="space-y-2">
        {(["analysis", "strategy", "execution", "confirmation", "validation"] as Phase[]).map((phaseName) => {
          const status = getPhaseStatus(phaseName);
          return (
            <div key={phaseName} className="flex items-center gap-2">
              <div className="w-24 flex items-center gap-1.5">
                {status === "complete" && <CheckCircle2 className="w-3 h-3 text-accent flex-shrink-0" />}
                {status === "active" && (
                  <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                )}
                {status === "pending" && <div className="w-3 h-3 rounded-full border border-muted-foreground/30 flex-shrink-0" />}
                <span className={cn(
                  "text-[10px] truncate",
                  status === "complete" && "text-accent",
                  status === "active" && "text-primary",
                  status === "pending" && "text-muted-foreground/50"
                )}>
                  {phaseName.charAt(0).toUpperCase() + phaseName.slice(1)}
                </span>
              </div>
              <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-200",
                    status === "complete" && "bg-accent",
                    status === "active" && "bg-primary",
                    status === "pending" && "bg-transparent"
                  )}
                  style={{ width: `${phaseProgress[phaseName]}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Activity Detail */}
      {isActive && !isCompleted && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Algorithm</span>
            <span className="font-mono text-foreground">{algorithmName}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Technique</span>
            <span className="text-foreground">{technique.charAt(0).toUpperCase() + technique.slice(1)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Records</span>
            <span className="font-mono text-foreground">{recordsProcessed.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Completed State */}
      {isCompleted && (
        <div className="mt-3 pt-3 border-t border-accent/30 flex items-center justify-between">
          <span className="text-[10px] text-accent font-medium">Field Secured</span>
          <span className="text-[10px] text-muted-foreground">{recordsProcessed.toLocaleString()} records</span>
        </div>
      )}

      {/* Execution Log Panel */}
      <ExecutionLog
        fieldName={fieldName}
        method={method}
        technique={technique}
        currentPhase={phase}
        phaseProgress={phaseProgress}
        isActive={isActive}
        isCompleted={isCompleted}
      />
    </div>
  );
};
