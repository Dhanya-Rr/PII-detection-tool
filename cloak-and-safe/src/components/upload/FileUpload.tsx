import { useState, useCallback } from "react";
import { Upload, File, X, FileText, Table, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "processing" | "complete" | "error";
  progress: number;
  recordsFound?: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.includes("csv") || type.includes("excel") || type.includes("spreadsheet")) {
    return Table;
  }
  if (type.includes("json") || type.includes("text")) {
    return FileText;
  }
  return File;
};

export const FileUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const simulateUpload = (file: File) => {
    const newFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      progress: 0,
    };

    setFiles((prev) => [...prev, newFile]);

    // Simulate upload progress
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadInterval);
        
        // Start processing
        setFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id ? { ...f, status: "processing", progress: 100 } : f
          )
        );

        // Simulate processing complete
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === newFile.id
                ? { ...f, status: "complete", recordsFound: Math.floor(Math.random() * 1000) + 100 }
                : f
            )
          );
          toast.success(`${file.name} processed successfully!`);
        }, 1500);
      } else {
        setFiles((prev) =>
          prev.map((f) => (f.id === newFile.id ? { ...f, progress } : f))
        );
      }
    }, 200);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(simulateUpload);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(simulateUpload);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          File Upload
        </CardTitle>
        <CardDescription>
          Upload CSV, JSON, Excel, or text files for PII detection and masking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-secondary/50"
          )}
        >
          <input
            type="file"
            multiple
            accept=".csv,.json,.xlsx,.xls,.txt"
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          
          <div className={cn(
            "rounded-full p-4 transition-all",
            isDragging ? "bg-primary/20 scale-110" : "bg-secondary"
          )}>
            <Upload className={cn(
              "h-8 w-8 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <p className="mt-4 text-lg font-medium">
            {isDragging ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            or click to browse
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Supported formats: CSV, JSON, Excel, TXT
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Uploaded Files</h4>
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-4 rounded-lg border bg-card p-4"
                >
                  <div className={cn(
                    "rounded-lg p-2",
                    file.status === "complete" ? "bg-success/10" : "bg-primary/10"
                  )}>
                    <FileIcon className={cn(
                      "h-5 w-5",
                      file.status === "complete" ? "text-success" : "text-primary"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{file.name}</p>
                      {file.status === "complete" && (
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-danger flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                      {file.status === "processing" && (
                        <span className="text-sm text-warning animate-pulse">
                          Processing...
                        </span>
                      )}
                      {file.recordsFound !== undefined && (
                        <span className="text-sm text-success">
                          {file.recordsFound} records found
                        </span>
                      )}
                    </div>
                    {file.status === "uploading" && (
                      <Progress value={file.progress} className="mt-2 h-1.5" />
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {files.some((f) => f.status === "complete") && (
          <Button 
            className="w-full gradient-primary"
            onClick={() => toast.success("PII Detection started! Scanning uploaded files...")}
          >
            Start PII Detection
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
