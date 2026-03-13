/**
 * Startup Wizard Component
 * 
 * Guides new users through initial project setup.
 * Updated to use Django authentication instead of Supabase.
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Database, Shield, Scan, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { useProject, Project } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface StartupWizardProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  { id: 1, title: "Create Project", description: "Set up your first project", icon: FolderPlus },
  { id: 2, title: "Connect Database", description: "Link your data source", icon: Database },
  { id: 3, title: "Scan for PII", description: "Detect sensitive data", icon: Scan },
  { id: 4, title: "Mask & Anonymize", description: "Protect your data", icon: Shield },
];

export const StartupWizard = ({ open, onComplete }: StartupWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { setCurrentProject, addProject } = useProject();
  const { user } = useAuth();
  const navigate = useNavigate();

  const progress = (currentStep / steps.length) * 100;

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    if (!user) {
      toast.error("Please log in first");
      return;
    }

    setIsCreating(true);
    try {
      // Create a new project object
      const newProject: Project = {
        id: crypto.randomUUID(),
        user_id: String(user.id),
        name: projectName.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add to projects list
      addProject(newProject);
      setCurrentProject(newProject);
      
      // Store wizard completion status in localStorage
      localStorage.setItem(`wizard_completed_${user.id}`, 'true');

      toast.success("Project created successfully!");
      setCurrentStep(2);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleGoToDatabase = () => {
    if (user) {
      // Store wizard completion status
      localStorage.setItem(`wizard_completed_${user.id}`, 'true');
    }
    onComplete();
    navigate('/database');
  };

  const handleSkipWizard = () => {
    if (user) {
      // Store wizard completion status
      localStorage.setItem(`wizard_completed_${user.id}`, 'true');
    }
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold">Getting Started</DialogTitle>
          <DialogDescription>
            Let's set up your data masking project step by step
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="px-6 pb-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center gap-2 ${
                  currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep > step.id
                      ? 'bg-primary border-primary text-primary-foreground'
                      : currentStep === step.id
                      ? 'border-primary text-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className="text-xs font-medium text-center max-w-[80px]">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 min-h-[200px]">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <FolderPlus className="h-12 w-12 mx-auto text-primary mb-3" />
                <h3 className="text-lg font-semibold">Create Your First Project</h3>
                <p className="text-sm text-muted-foreground">
                  A project helps you organize your data masking work
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Customer Database Masking"
                  className="text-base"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleSkipWizard}
                  className="flex-1"
                >
                  Skip Wizard
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={isCreating || !projectName.trim()}
                  className="flex-1 gradient-primary"
                >
                  {isCreating ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Database className="h-12 w-12 mx-auto text-primary mb-3" />
                <h3 className="text-lg font-semibold">Connect Your Database</h3>
                <p className="text-sm text-muted-foreground">
                  Next, connect to your database to scan for PII
                </p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p>You'll need:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Database host and port</li>
                  <li>Database name</li>
                  <li>Username and password</li>
                </ul>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleSkipWizard}
                  className="flex-1"
                >
                  Continue Later
                </Button>
                <Button
                  onClick={handleGoToDatabase}
                  className="flex-1 gradient-primary"
                >
                  Connect Database
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
