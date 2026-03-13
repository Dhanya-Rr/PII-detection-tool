import { useState, useRef } from "react";
import { ProcessingVisualization } from "./ProcessingVisualization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Shield, 
  EyeOff, 
  CheckCircle2, 
  Download, 
  Database,
  Loader2,
  Settings
} from "lucide-react";
import { useProject, DetectedField } from "@/contexts/ProjectContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type WizardStep = 1 | 2 | 3;

type ProtectionMethod = "masking" | "anonymization" | "";

interface FieldConfig {
  method: ProtectionMethod;
  technique: string;
  parameters: {
    maskingChar?: string;
    tokenFormat?: string;
    generalizationLevel?: string;
    suppressionBehavior?: string;
  };
}

interface SelectedField extends DetectedField {
  selected: boolean;
  config: FieldConfig;
}

interface ProcessingField {
  field: SelectedField;
  status: "pending" | "processing" | "complete";
  progress: number;
}

const maskingTechniques = [
  { value: "partial_redaction", label: "Partial Redaction" },
  { value: "redaction", label: "Redaction" },
  { value: "character_replacement", label: "Character Replacement" },
  { value: "tokenization", label: "Tokenization" },
  { value: "shuffling", label: "Shuffling" },
  { value: "nulling", label: "Nulling" },
  { value: "date_masking", label: "Date Masking" },
  { value: "data_perturbation", label: "Data Perturbation" },
];

const anonymizationTechniques = [
  { value: "generalization", label: "Data Generalization" },
  { value: "randomization", label: "Randomization" },
  { value: "hashing", label: "Hashing" },
  { value: "swapping", label: "Swapping" },
  { value: "noise_addition", label: "Noise Addition" },
  { value: "k_anonymity", label: "k-Anonymity" },
  { value: "l_diversity", label: "l-Diversity" },
];

const maskingCharacters = [
  { value: "*", label: "Asterisk (*)" },
  { value: "#", label: "Hash (#)" },
  { value: "X", label: "X Character" },
  { value: "•", label: "Bullet (•)" },
];

const tokenFormats = [
  { value: "uuid", label: "UUID Format" },
  { value: "alphanumeric", label: "Alphanumeric" },
  { value: "numeric", label: "Numeric Only" },
  { value: "prefix", label: "Prefixed Token" },
];

const generalizationLevels = [
  { value: "low", label: "Low (Keep most detail)" },
  { value: "medium", label: "Medium (Moderate generalization)" },
  { value: "high", label: "High (Maximum generalization)" },
];

const suppressionBehaviors = [
  { value: "null", label: "Replace with NULL" },
  { value: "empty", label: "Replace with Empty" },
  { value: "placeholder", label: "Replace with [REDACTED]" },
];

export const MaskingWizard = () => {
  const { detectedFields } = useProject();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>(
    detectedFields.map(f => ({ 
      ...f, 
      selected: false,
      config: {
        method: "",
        technique: "",
        parameters: {}
      }
    }))
  );
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [processingFields, setProcessingFields] = useState<ProcessingField[]>([]);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const processingRef = useRef<boolean>(false);

  const getSelectedFields = () => selectedFields.filter(f => f.selected);
  const selectedCount = getSelectedFields().length;

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.map(f => f.id === fieldId ? { ...f, selected: !f.selected } : f)
    );
  };

  const handleSelectAll = () => {
    const allSelected = selectedFields.every(f => f.selected);
    setSelectedFields(prev => prev.map(f => ({ ...f, selected: !allSelected })));
  };

  const updateFieldMethod = (fieldId: string, method: ProtectionMethod) => {
    setSelectedFields(prev =>
      prev.map(f => f.id === fieldId 
        ? { ...f, config: { method, technique: "", parameters: {} } } 
        : f
      )
    );
  };

  const updateFieldTechnique = (fieldId: string, technique: string) => {
    setSelectedFields(prev =>
      prev.map(f => f.id === fieldId 
        ? { ...f, config: { ...f.config, technique, parameters: {} } } 
        : f
      )
    );
  };

  const updateFieldParameter = (fieldId: string, paramKey: string, value: string) => {
    setSelectedFields(prev =>
      prev.map(f => f.id === fieldId 
        ? { 
            ...f, 
            config: { 
              ...f.config, 
              parameters: { ...f.config.parameters, [paramKey]: value } 
            } 
          } 
        : f
      )
    );
  };

  // Check if a field needs a parameter based on its technique
  const fieldNeedsParameter = (field: SelectedField): boolean => {
    const { technique, method } = field.config;
    // Masking techniques that need parameters
    if (technique === "partial_redaction" || technique === "character_replacement") {
      return true; // needs maskingChar
    }
    if (technique === "tokenization") {
      return true; // needs tokenFormat
    }
    // Anonymization techniques that need parameters
    if (technique === "generalization") {
      return true; // needs generalizationLevel
    }
    if (technique === "nulling") {
      return true; // needs suppressionBehavior
    }
    // Most techniques don't need extra params
    return false;
  };

  // Check if a field has its required parameter set
  const fieldHasRequiredParameter = (field: SelectedField): boolean => {
    const { technique, parameters } = field.config;
    if (technique === "partial_redaction" || technique === "character_replacement") {
      return !!parameters.maskingChar;
    }
    if (technique === "tokenization") {
      return !!parameters.tokenFormat;
    }
    if (technique === "generalization") {
      return !!parameters.generalizationLevel;
    }
    if (technique === "nulling") {
      return !!parameters.suppressionBehavior;
    }
    // Most techniques don't need extra params
    return true;
  };

  // Check if current field is fully configured
  const isCurrentFieldConfigured = (): boolean => {
    const fieldsToConfig = getSelectedFields();
    if (fieldsToConfig.length === 0 || currentFieldIndex >= fieldsToConfig.length) return false;
    const currentField = fieldsToConfig[currentFieldIndex];
    return (
      currentField.config.method !== "" &&
      currentField.config.technique !== "" &&
      fieldHasRequiredParameter(currentField)
    );
  };

  // Check if all fields are configured
  const allFieldsConfigured = (): boolean => {
    return getSelectedFields().every(f => 
      f.config.method !== "" && 
      f.config.technique !== "" && 
      fieldHasRequiredParameter(f)
    );
  };

  // Validation for each step
  const canProceedStep1 = selectedCount > 0;

  const handleNextField = () => {
    const fieldsToConfig = getSelectedFields();
    if (currentFieldIndex < fieldsToConfig.length - 1) {
      setCurrentFieldIndex(prev => prev + 1);
    } else {
      // All fields configured, proceed to step 3
      setCurrentStep(3);
    }
  };

  const handlePrevField = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(prev => prev - 1);
    } else {
      // Go back to step 1
      setCurrentStep(1);
    }
  };

  // Called by ProcessingVisualization when a single field simulation completes
  const handleSingleFieldComplete = (fieldId: string) => {
    setProcessingFields(prev => prev.map(pf => 
      pf.field.id === fieldId 
        ? { ...pf, status: "complete" as const, progress: 100 }
        : pf
    ));
  };

  // Called by ProcessingVisualization when ALL field simulations complete
  const handleAllFieldsComplete = () => {
    // Mark all processing fields as complete
    setProcessingFields(prev => prev.map(pf => ({
      ...pf,
      status: "complete" as const,
      progress: 100
    })));
    
    // End processing state and show completion
    setIsProcessing(false);
    setIsComplete(true);
    toast.success("Data protection applied successfully!");
  };

  const handleProtect = async () => {
    setIsProcessing(true);
    processingRef.current = true;
    
    const fieldsToProcess = getSelectedFields().map(f => ({
      field: f,
      status: "processing" as const,
      progress: 0
    }));
    
    setProcessingFields(fieldsToProcess);
    setCurrentProcessingIndex(0);

    // The actual completion is now controlled by ProcessingVisualization
    // via the onAllFieldsComplete callback - this function just starts processing
    // and keeps isProcessing=true until all FieldSimulation components complete
  };

  const handleExport = (format: string) => {
    const selectedFieldsData = getSelectedFields();
    
    // Create detailed masked data for export
    const maskedData = selectedFieldsData.map(f => ({
      field: f.field_name,
      table: f.table_name || "N/A",
      type: f.field_type,
      protection_method: f.config.method === "masking" ? "Data Masking" : "Anonymization",
      technique: f.config.technique,
      parameters: JSON.stringify(f.config.parameters),
      status: "protected"
    }));

    const timestamp = new Date().toISOString().split('T')[0];
    let content = "";
    let mimeType = "";
    let extension = "";

    if (format === "csv") {
      const headers = Object.keys(maskedData[0]).join(",");
      const rows = maskedData.map(row => Object.values(row).join(",")).join("\n");
      content = `${headers}\n${rows}`;
      mimeType = "text/csv";
      extension = "csv";

      const blob = new Blob([content], { type: mimeType });
      downloadBlob(blob, `masked_data_${timestamp}.${extension}`);
    } else if (format === "json") {
      content = JSON.stringify(maskedData, null, 2);
      mimeType = "application/json";
      extension = "json";

      const blob = new Blob([content], { type: mimeType });
      downloadBlob(blob, `masked_data_${timestamp}.${extension}`);
    } else if (format === "excel") {
      // Create proper Excel file using xlsx library
      const ws = XLSX.utils.json_to_sheet(maskedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Masked Data");
      XLSX.writeFile(wb, `masked_data_${timestamp}.xlsx`);
    }

    setShowExportDialog(false);
    toast.success(`File downloaded as ${format.toUpperCase()}`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (detectedFields.length === 0) {
    return (
      <Card className="glass-effect">
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No PII Fields Detected</h3>
          <p className="text-muted-foreground">
            Please scan your database for PII fields first
          </p>
          <Button className="mt-4" onClick={() => window.location.href = '/detection'}>
            Go to PII Detection
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stepLabels = ["Select Fields", "Configure Protection", "Protect Data"];
  const fieldsToConfig = getSelectedFields();
  const currentField = fieldsToConfig[currentFieldIndex];

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card className="glass-effect">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Step {currentStep} of 3</span>
            <span className="text-sm text-muted-foreground">
              {stepLabels[currentStep - 1]}
            </span>
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-2" />
          <div className="flex justify-between mt-4">
            {[1, 2, 3].map(step => (
              <div 
                key={step}
                className={`flex flex-col items-center gap-1 ${currentStep >= step ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= step ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                  {step}
                </div>
                <span className="text-xs hidden sm:block">
                  {step === 1 && "Select"}
                  {step === 2 && "Configure"}
                  {step === 3 && "Protect"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select Fields */}
      {currentStep === 1 && (
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-primary" />
              Select PII Fields to Protect
            </CardTitle>
            <CardDescription>
              Choose which fields you want to mask or anonymize
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedFields.every(f => f.selected) ? 'Deselect All' : 'Select All'}
              </Button>
              <Badge variant="secondary">{selectedCount} selected</Badge>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-auto">
              {selectedFields.map((field) => (
                <div
                  key={field.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                    field.selected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                >
                  <Checkbox
                    id={field.id}
                    checked={field.selected}
                    onCheckedChange={() => handleFieldToggle(field.id)}
                  />
                  <Label htmlFor={field.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{field.field_name}</span>
                      <Badge variant="outline" className="text-xs">{field.field_type}</Badge>
                    </div>
                    {field.table_name && (
                      <span className="text-xs text-muted-foreground">
                        Table: {field.table_name}
                      </span>
                    )}
                  </Label>
                  <Badge 
                    variant={field.confidence >= 90 ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {field.confidence}% confidence
                  </Badge>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => {
                  setCurrentFieldIndex(0);
                  setCurrentStep(2);
                }} 
                disabled={!canProceedStep1}
                className="gradient-primary"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Sequential Field-by-Field Configuration */}
      {currentStep === 2 && currentField && (
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configure Protection
            </CardTitle>
            <CardDescription>
              Field {currentFieldIndex + 1} of {fieldsToConfig.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Single Field Display */}
            <div className="border rounded-lg p-6 space-y-6">
              {/* Field Name - Read Only */}
              <div className="text-center border-b pb-4">
                <span 
                  className="font-mono text-xl font-semibold text-foreground select-none pointer-events-none"
                  style={{ cursor: 'default' }}
                >
                  {currentField.field_name}
                </span>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">{currentField.field_type}</Badge>
                  {currentField.table_name && (
                    <span className="text-xs text-muted-foreground">
                      ({currentField.table_name})
                    </span>
                  )}
                </div>
              </div>

              {/* Method Selection - Two Buttons */}
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">1. Select Protection Method</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant={currentField.config.method === 'masking' ? 'default' : 'outline'}
                    className={`justify-start h-auto py-4 ${
                      currentField.config.method === 'masking' 
                        ? 'bg-primary text-primary-foreground' 
                        : ''
                    }`}
                    onClick={() => updateFieldMethod(currentField.id, 'masking')}
                  >
                    <EyeOff className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Data Masking</div>
                      <div className="text-xs opacity-80">Partially or fully hide data</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={currentField.config.method === 'anonymization' ? 'default' : 'outline'}
                    className={`justify-start h-auto py-4 ${
                      currentField.config.method === 'anonymization' 
                        ? 'bg-primary text-primary-foreground' 
                        : ''
                    }`}
                    onClick={() => updateFieldMethod(currentField.id, 'anonymization')}
                  >
                    <Shield className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Anonymization</div>
                      <div className="text-xs opacity-80">Remove or replace data entirely</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Technique Selection - Only show after method is selected */}
              {currentField.config.method && (
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">2. Select Technique</Label>
                  <Select 
                    value={currentField.config.technique} 
                    onValueChange={(value) => updateFieldTechnique(currentField.id, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a technique" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      {(currentField.config.method === 'masking' ? maskingTechniques : anonymizationTechniques).map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Parameter Selection - Only show after technique is selected and needs params */}
              {currentField.config.technique && fieldNeedsParameter(currentField) && (
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">3. Configure Parameters</Label>
                  
                  {/* Masking character for partial redaction and character replacement */}
                  {(currentField.config.technique === 'partial_redaction' || 
                    currentField.config.technique === 'character_replacement') && (
                    <Select 
                      value={currentField.config.parameters.maskingChar || ""} 
                      onValueChange={(value) => updateFieldParameter(currentField.id, 'maskingChar', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select masking character" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        {maskingCharacters.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Token format for tokenization */}
                  {currentField.config.technique === 'tokenization' && (
                    <Select 
                      value={currentField.config.parameters.tokenFormat || ""} 
                      onValueChange={(value) => updateFieldParameter(currentField.id, 'tokenFormat', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select token format" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        {tokenFormats.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Generalization level */}
                  {currentField.config.technique === 'generalization' && (
                    <Select 
                      value={currentField.config.parameters.generalizationLevel || ""} 
                      onValueChange={(value) => updateFieldParameter(currentField.id, 'generalizationLevel', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select generalization level" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        {generalizationLevels.map(l => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Nulling/Suppression behavior */}
                  {currentField.config.technique === 'nulling' && (
                    <Select 
                      value={currentField.config.parameters.suppressionBehavior || ""} 
                      onValueChange={(value) => updateFieldParameter(currentField.id, 'suppressionBehavior', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select nulling behavior" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        {suppressionBehaviors.map(b => (
                          <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* No additional params message */}
              {currentField.config.technique && !fieldNeedsParameter(currentField) && (
                <p className="text-sm text-muted-foreground italic text-center py-2">
                  No additional configuration needed for this technique.
                </p>
              )}

              {/* Configuration status indicator */}
              {isCurrentFieldConfigured() && (
                <div className="flex items-center justify-center gap-2 text-sm text-accent pt-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Field Configured</span>
                </div>
              )}
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2">
              {fieldsToConfig.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentFieldIndex 
                      ? 'bg-primary w-4' 
                      : idx < currentFieldIndex 
                        ? 'bg-accent' 
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handlePrevField}>
                <ChevronLeft className="mr-2 h-4 w-4" /> 
                {currentFieldIndex === 0 ? 'Back to Selection' : 'Previous Field'}
              </Button>
              <Button 
                onClick={handleNextField} 
                disabled={!isCurrentFieldConfigured()}
                className="gradient-primary"
              >
                {currentFieldIndex === fieldsToConfig.length - 1 ? 'Proceed to Protect' : 'Next Field'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Protect Data with Field-by-Field Processing */}
      {currentStep === 3 && (
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Protect Your Data
            </CardTitle>
            <CardDescription>
              {isProcessing 
                ? "Processing your data field by field..." 
                : isComplete 
                  ? "Protection applied successfully!" 
                  : "Review and apply protection to your selected fields"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isComplete && !isProcessing && (
              <>
                {/* Summary before processing */}
                <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">Protection Summary</h4>
                  <div className="space-y-2 max-h-[300px] overflow-auto">
                    {getSelectedFields().map(field => (
                      <div key={field.id} className="flex items-center justify-between text-sm border-b pb-2">
                        <span className="font-mono select-none">{field.field_name}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {field.config.method === 'masking' ? 'Masking' : 'Anonymization'}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {field.config.technique}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => {
                    setCurrentFieldIndex(fieldsToConfig.length - 1);
                    setCurrentStep(2);
                  }}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  <Button 
                    onClick={handleProtect}
                    className="gradient-primary"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Protect Your Data
                  </Button>
                </div>
              </>
            )}

            {/* Processing View - Field by Field with Cinematic Visualization */}
            {isProcessing && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Field Status List */}
                <div className="space-y-4">
                  <div className="space-y-3 max-h-[450px] overflow-auto">
                    {processingFields.map((pf) => (
                      <div 
                        key={pf.field.id} 
                        className={`border rounded-lg p-4 transition-all ${
                          pf.status === 'processing' ? 'border-primary bg-primary/5' : 
                          pf.status === 'complete' ? 'border-accent bg-accent/5' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {pf.status === 'complete' && <CheckCircle2 className="h-4 w-4 text-accent" />}
                            {pf.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                            <span className="font-mono font-medium select-none">{pf.field.field_name}</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">{pf.field.config.technique}</Badge>
                            <Badge 
                              variant={pf.status === 'complete' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {pf.status === 'pending' && 'Pending'}
                              {pf.status === 'processing' && 'Processing...'}
                              {pf.status === 'complete' && 'Complete'}
                            </Badge>
                          </div>
                        </div>
                        {pf.status === 'processing' && (
                          <Progress value={pf.progress} className="h-2" />
                        )}
                        {pf.status === 'complete' && (
                          <p className="text-xs text-accent">
                            Applied {pf.field.config.technique} technique successfully
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side - Per-Field Parallel Processing Visualization */}
                <div className="hidden lg:block">
                  <ProcessingVisualization 
                    currentFieldIndex={currentProcessingIndex}
                    totalFields={processingFields.length}
                    isProcessing={isProcessing}
                    currentFieldName={processingFields[currentProcessingIndex]?.field.field_name}
                    currentMethod={processingFields[currentProcessingIndex]?.field.config.method}
                    currentTechnique={processingFields[currentProcessingIndex]?.field.config.technique}
                    allFields={processingFields.map(pf => ({
                      id: pf.field.id,
                      fieldName: pf.field.field_name,
                      method: pf.field.config.method,
                      technique: pf.field.config.technique
                    }))}
                    onAllFieldsComplete={handleAllFieldsComplete}
                    onFieldComplete={handleSingleFieldComplete}
                  />
                </div>
              </div>
            )}

            {/* Completion View */}
            {isComplete && (
              <>
                <div className="text-center py-6">
                  <CheckCircle2 className="h-16 w-16 mx-auto text-accent mb-4" />
                  <h3 className="text-xl font-semibold text-accent mb-2">
                    Protection Applied Successfully!
                  </h3>
                  <p className="text-muted-foreground">
                    All {selectedCount} fields have been protected with your configured settings
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-auto py-4"
                    onClick={() => toast.info("Push to Database - Feature coming soon")}
                  >
                    <Database className="mr-2 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Push to Database</div>
                      <div className="text-xs text-muted-foreground">Update source database</div>
                    </div>
                  </Button>
                  <Button
                    className="h-auto py-4 gradient-primary"
                    onClick={() => setShowExportDialog(true)}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Export File</div>
                      <div className="text-xs text-primary-foreground/70">Download protected data</div>
                    </div>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-background">
            <CardHeader>
              <CardTitle>Export Protected Data</CardTitle>
              <CardDescription>Choose your preferred file format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => handleExport('csv')}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV Format (.csv)
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => handleExport('json')}
              >
                <Download className="mr-2 h-4 w-4" />
                JSON Format (.json)
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => handleExport('excel')}
              >
                <Download className="mr-2 h-4 w-4" />
                Excel Format (.xlsx)
              </Button>
              <Button 
                variant="ghost" 
                className="w-full mt-2" 
                onClick={() => setShowExportDialog(false)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
