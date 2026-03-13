import { useEffect, useState, useCallback } from "react";
import { Shield, CheckCircle2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldSimulation } from "./FieldSimulation";

interface FieldConfig {
  id: string;
  fieldName: string;
  method: "masking" | "anonymization" | "";
  technique: string;
}

interface ProcessingVisualizationProps {
  currentFieldIndex: number;
  totalFields: number;
  isProcessing: boolean;
  currentFieldName?: string;
  currentMethod?: "masking" | "anonymization" | "";
  currentTechnique?: string;
  allFields?: FieldConfig[];
  onAllFieldsComplete?: () => void;
  onFieldComplete?: (fieldId: string) => void;
}

export const ProcessingVisualization = ({ 
  currentFieldIndex, 
  totalFields, 
  isProcessing,
  currentFieldName = "Field",
  currentMethod = "masking",
  currentTechnique = "default",
  allFields = [],
  onAllFieldsComplete,
  onFieldComplete
}: ProcessingVisualizationProps) => {
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  const [isAllComplete, setIsAllComplete] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasNotifiedCompletion, setHasNotifiedCompletion] = useState(false);

  // Reset state when processing starts
  useEffect(() => {
    if (isProcessing) {
      setCompletedFields(new Set());
      setIsAllComplete(false);
      setTotalRecords(0);
      setHasNotifiedCompletion(false);
    }
  }, [isProcessing]);

  // Check if all fields are complete - ONLY when all FieldSimulations report completion
  useEffect(() => {
    if (allFields.length > 0 && completedFields.size === allFields.length && !hasNotifiedCompletion) {
      // All field simulations have completed
      setIsAllComplete(true);
      setTotalRecords(allFields.length * Math.floor(Math.random() * 2000 + 1000));
      
      // Notify parent that all fields are truly complete
      if (onAllFieldsComplete) {
        setHasNotifiedCompletion(true);
        onAllFieldsComplete();
      }
    }
  }, [completedFields, allFields.length, onAllFieldsComplete, hasNotifiedCompletion]);

  const handleFieldComplete = useCallback((fieldId: string) => {
    setCompletedFields(prev => new Set([...prev, fieldId]));
    // Notify parent about individual field completion
    if (onFieldComplete) {
      onFieldComplete(fieldId);
    }
  }, [onFieldComplete]);

  // Generate field configs if not provided
  const fieldsToProcess: FieldConfig[] = allFields.length > 0 ? allFields : [{
    id: "single-field",
    fieldName: currentFieldName,
    method: currentMethod,
    technique: currentTechnique
  }];

  if (!isProcessing && !isAllComplete) return null;

  // Completion Summary - only shown when ALL field simulations complete
  if (isAllComplete) {
    const maskingCount = fieldsToProcess.filter(f => f.method === "masking").length;
    const anonymizationCount = fieldsToProcess.filter(f => f.method === "anonymization").length;

    return (
      <div className="w-full h-full min-h-[400px] bg-card rounded-xl border border-border p-6 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-accent" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Data Protection Completed</h3>
            <p className="text-sm text-muted-foreground">All selected fields have been secured</p>
          </div>

          <div className="w-full max-w-sm space-y-3 pt-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Total Fields Secured</span>
              <span className="text-sm font-medium text-foreground">{fieldsToProcess.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Records Processed</span>
              <span className="text-sm font-medium text-foreground">{totalRecords.toLocaleString()}</span>
            </div>
            {maskingCount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Fields Masked</span>
                <span className="text-sm font-medium text-foreground">{maskingCount}</span>
              </div>
            )}
            {anonymizationCount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Fields Anonymized</span>
                <span className="text-sm font-medium text-foreground">{anonymizationCount}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-4 text-accent">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Secure and Compliant</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] bg-card rounded-xl border border-border overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Parallel Field Processing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {completedFields.size} / {fieldsToProcess.length} Complete
            </span>
          </div>
        </div>
      </div>

      {/* Per-Field Simulations */}
      <div className="flex-1 p-4 space-y-3 overflow-auto">
        {fieldsToProcess.map((field, index) => (
          <FieldSimulation
            key={field.id}
            fieldName={field.fieldName}
            method={field.method}
            technique={field.technique}
            isActive={isProcessing}
            onComplete={() => handleFieldComplete(field.id)}
          />
        ))}
      </div>

      {/* Footer - Overall Progress */}
      <div className="px-4 py-3 border-t border-border bg-secondary/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Processing {fieldsToProcess.length} fields in parallel</span>
          <span>{Math.round((completedFields.size / fieldsToProcess.length) * 100)}% Complete</span>
        </div>
        <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(completedFields.size / fieldsToProcess.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};