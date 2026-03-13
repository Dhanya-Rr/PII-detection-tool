/**
 * New Project Dialog Component
 * 
 * Dialog for creating new projects.
 * Uses Django backend API for project creation.
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewProjectDialog = ({ open, onOpenChange }: NewProjectDialogProps) => {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { createProject, error, clearError } = useProject();
  const { user } = useAuth();

  const handleCreate = async () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    if (!user) {
      toast.error("Please log in first");
      return;
    }

    setIsCreating(true);
    clearError();
    
    try {
      const newProject = await createProject(
        projectName.trim(),
        description.trim() || undefined
      );

      if (newProject) {
        toast.success("Project created successfully!");
        setProjectName("");
        setDescription("");
        onOpenChange(false);
      } else {
        // Error is handled by context, but show a generic toast if no specific error
        toast.error(error || "Failed to create project");
      }
    } catch (err) {
      console.error('Error creating project:', err);
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setProjectName("");
    setDescription("");
    clearError();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            New Project
          </DialogTitle>
          <DialogDescription>
            Create a new project to organize your data masking work
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="newProjectName">Project Name *</Label>
            <Input
              id="newProjectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Customer Database Masking"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCreate()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectDescription">Description (optional)</Label>
            <Textarea
              id="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
              rows={3}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !projectName.trim()}
              className="flex-1 gradient-primary"
            >
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
