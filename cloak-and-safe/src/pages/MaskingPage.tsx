import { useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Scan, Zap, Settings, Terminal } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useNavigate } from "react-router-dom";
import { MaskingWizard } from "@/components/masking/MaskingWizard";
import { MaskingProgress } from "@/components/masking/MaskingProgress";
import { ExecutionConsole } from "@/components/masking/ExecutionConsole";
import { toast } from "sonner";

const MaskingPage = () => {
  const { currentProject, detectedFields } = useProject();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"quick" | "advanced" | "console">("quick");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Callback when masking job starts - to share jobId with ExecutionConsole
  const handleJobStarted = useCallback((jobId: string) => {
    console.log('[MaskingPage] Job started:', jobId);
    setCurrentJobId(jobId);
  }, []);

  if (!currentProject) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Masking</h1>
            <p className="text-muted-foreground mt-1">
              Protect your sensitive data with masking and anonymization
            </p>
          </div>
          <Card className="glass-effect">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
              <p className="text-muted-foreground mb-4">
                Please select or create a project first
              </p>
              <Button onClick={() => navigate('/')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (detectedFields.length === 0) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Masking</h1>
            <p className="text-muted-foreground mt-1">
              Protect your sensitive data with masking and anonymization
            </p>
            <Badge variant="outline" className="mt-2">
              Project: {currentProject.name}
            </Badge>
          </div>
          <Card className="glass-effect">
            <CardContent className="py-12 text-center">
              <Scan className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No PII Fields Detected</h3>
              <p className="text-muted-foreground mb-4">
                Please scan your database for PII fields first
              </p>
              <Button onClick={() => navigate('/detection')}>
                Go to PII Detection
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Masking</h1>
          <p className="text-muted-foreground mt-1">
            Protect your sensitive data with masking and anonymization
          </p>
          <Badge variant="outline" className="mt-2">
            Project: {currentProject.name}
          </Badge>
        </div>

        {/* Mode Selection Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "quick" | "advanced" | "console")}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Masking
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Advanced Configuration
            </TabsTrigger>
            <TabsTrigger value="console" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Execution Console
            </TabsTrigger>
          </TabsList>

          {/* Quick Masking - Uses backend auto-masking with SSE progress */}
          <TabsContent value="quick">
            <div className="space-y-4">
              <Card className="glass-effect">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Quick Masking Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically applies optimal masking strategies to all detected PII fields.
                        Watch real-time progress as each field is processed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <MaskingProgress 
                onComplete={(results) => {
                  console.log('Masking completed with results:', results);
                  toast.success(`Successfully masked ${results.length} fields!`);
                }}
                onError={(error) => {
                  console.error('Masking error:', error);
                }}
                onJobStarted={handleJobStarted}
              />

              {/* Show execution console alongside progress when a job is running */}
              {currentJobId && currentProject && (
                <ExecutionConsole
                  projectId={currentProject.id}
                  jobId={currentJobId}
                  autoScroll={true}
                />
              )}
            </div>
          </TabsContent>

          {/* Advanced Configuration - Uses step-by-step wizard */}
          <TabsContent value="advanced">
            <div className="space-y-4">
              <Card className="glass-effect">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Advanced Configuration Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Manually select fields and configure specific masking strategies,
                        techniques, and parameters for each field.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <MaskingWizard />
            </div>
          </TabsContent>

          {/* Execution Console - Standalone audit log viewer */}
          <TabsContent value="console">
            <div className="space-y-4">
              <Card className="glass-effect">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Terminal className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Execution Console</p>
                      <p className="text-sm text-muted-foreground">
                        View real-time audit logs and execution details for masking jobs.
                        Enterprise-grade traceability for all masking operations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {currentProject && (
                <ExecutionConsole
                  projectId={currentProject.id}
                  jobId={currentJobId}
                  autoScroll={true}
                  maxLines={1000}
                />
              )}

              {!currentJobId && (
                <Card className="glass-effect">
                  <CardContent className="py-8 text-center">
                    <Terminal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Job</h3>
                    <p className="text-muted-foreground mb-4">
                      Start a masking job from the Quick Masking tab to see execution logs here.
                    </p>
                    <Button onClick={() => setActiveTab("quick")}>
                      Go to Quick Masking
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MaskingPage;
