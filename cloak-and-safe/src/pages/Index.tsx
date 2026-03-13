import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { PIIDistributionChart } from "@/components/dashboard/PIIDistributionChart";
import { MaskingMethodsChart } from "@/components/dashboard/MaskingMethodsChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Database, AlertTriangle, Clock, Plus, FolderOpen, Loader2, Scan } from "lucide-react";
import { useSearch } from "@/contexts/SearchContext";
import { useProject, type Project } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { StartupWizard } from "@/components/wizard/StartupWizard";
import { NewProjectDialog } from "@/components/project/NewProjectDialog";
import { ProjectList } from "@/components/project/ProjectList";
import { toast } from "sonner";
import {
  fetchDashboardData,
  type DashboardData,
  EMPTY_DASHBOARD_DATA,
} from "@/api/dashboard";
import { startPiiScan, parseScanError } from "@/api/piiScan";

const Index = () => {
  const { searchQuery } = useSearch();
  const { 
    currentProject, 
    setCurrentProject, 
    projects, 
    isLoading, 
    selectProject 
  } = useProject();
  const { isAuthenticated, user } = useAuth();
  const [showStartupWizard, setShowStartupWizard] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  
  // Dashboard data state - fetched from API
  const [dashboardData, setDashboardData] = useState<DashboardData>(EMPTY_DASHBOARD_DATA);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  
  // Scan state
  const [isScanning, setIsScanning] = useState(false);

  // Function to load dashboard data
  const loadDashboardData = async (projectId: string) => {
    setIsDashboardLoading(true);
    setDashboardError(null);
    
    try {
      const data = await fetchDashboardData(projectId);
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setDashboardError('Failed to load dashboard data');
      setDashboardData(EMPTY_DASHBOARD_DATA);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  // Handle PII scan
  const handleStartScan = async () => {
    if (!currentProject?.id) return;
    
    setIsScanning(true);
    try {
      const result = await startPiiScan(currentProject.id);
      toast.success(`Scan completed! Found ${result.detected_fields} PII fields.`);
      
      // Refresh dashboard data to show new results
      await loadDashboardData(currentProject.id);
    } catch (err) {
      const errorMessage = parseScanError(err);
      toast.error(errorMessage);
      setDashboardError(errorMessage);
    } finally {
      setIsScanning(false);
    }
  };

  // Fetch dashboard data when project changes
  useEffect(() => {
    if (currentProject?.id) {
      loadDashboardData(currentProject.id);
    } else {
      // Reset dashboard data when no project selected
      setDashboardData(EMPTY_DASHBOARD_DATA);
      setDashboardError(null);
    }
  }, [currentProject?.id]);

  // Check if user needs onboarding (first login)
  useEffect(() => {
    if (isAuthenticated && user && projects.length === 0 && !isLoading) {
      // Show startup wizard for users with no projects
      const hasSeenWizard = localStorage.getItem(`wizard_completed_${user.id}`);
      if (!hasSeenWizard) {
        setShowStartupWizard(true);
      }
    }
  }, [isAuthenticated, user, projects.length, isLoading]);

  const handleWizardComplete = () => {
    setShowStartupWizard(false);
    if (user) {
      localStorage.setItem(`wizard_completed_${user.id}`, 'true');
    }
  };

  const handleSelectProject = async (project: Project) => {
    // The selectProject function in context handles the API call
    // and updates the current project state
    if (currentProject?.id !== project.id) {
      await selectProject(project.id);
    }
  };

  // Filter PII data based on search query (only if we have data)
  const filteredPiiData = searchQuery && (dashboardData?.piiDistribution?.length ?? 0) > 0
    ? dashboardData.piiDistribution.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : dashboardData?.piiDistribution ?? [];

  // Project Selection View (when no project is selected)
  if (!currentProject) {
    return (
      <Layout>
        <StartupWizard 
          open={showStartupWizard} 
          onComplete={handleWizardComplete} 
        />
        <NewProjectDialog 
          open={showNewProjectDialog} 
          onOpenChange={setShowNewProjectDialog} 
        />
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                {isAuthenticated ? "Select a project or create a new one to get started" : "Please log in to manage your projects"}
              </p>
            </div>
            {isAuthenticated && (
              <Button onClick={() => setShowNewProjectDialog(true)} className="gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            )}
          </div>

          {isAuthenticated ? (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  Your Projects
                </CardTitle>
                <CardDescription>
                  Select a project to view its data or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading projects...</p>
                  </div>
                ) : (
                  <ProjectList onSelectProject={handleSelectProject} />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-effect">
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Welcome to Data Masking Tool</h3>
                <p className="text-muted-foreground mb-4">
                  Please log in to access your projects and start protecting your data
                </p>
                <Button onClick={() => window.location.href = '/auth'}>
                  Login to Get Started
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    );
  }

  // Project Dashboard View (when a project is selected)
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentProject(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Projects
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{currentProject.name}</h1>
            <p className="text-muted-foreground mt-1">
              Project dashboard with PII detection and masking metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleStartScan}
              disabled={isScanning || isDashboardLoading}
              className="gradient-primary"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Scan className="mr-2 h-4 w-4" />
                  Start Scan
                </>
              )}
            </Button>
            <Badge variant="outline" className="text-sm">
              Active Project
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Scans"
            value={isDashboardLoading ? "..." : String(dashboardData?.stats?.totalScans ?? 0)}
            icon={FileText}
            trend={{ value: 0, isPositive: true }}
          />
          <StatCard
            title="PII Fields Found"
            value={isDashboardLoading ? "..." : String(dashboardData?.stats?.piiFieldsFound ?? 0)}
            icon={AlertTriangle}
            trend={{ value: 0, isPositive: false }}
          />
          <StatCard
            title="Data Masked"
            value={isDashboardLoading ? "..." : String(dashboardData?.stats?.dataMasked ?? 0)}
            icon={Shield}
            trend={{ value: 0, isPositive: true }}
          />
          <StatCard
            title="Tables Scanned"
            value={isDashboardLoading ? "..." : String(dashboardData?.stats?.tablesScanned ?? 0)}
            icon={Database}
            trend={{ value: 0, isPositive: true }}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* PII Distribution Chart */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>PII Distribution by Type</CardTitle>
              <CardDescription>
                Breakdown of detected personally identifiable information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PIIDistributionChart 
                data={filteredPiiData} 
                isLoading={isDashboardLoading}
                error={dashboardError}
              />
            </CardContent>
          </Card>

          {/* Masking Methods Chart */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Masking Methods Applied</CardTitle>
              <CardDescription>
                Distribution of masking techniques used
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaskingMethodsChart 
                data={dashboardData?.maskingMethods ?? []}
                isLoading={isDashboardLoading}
                error={dashboardError}
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest scans and masking operations</CardDescription>
          </CardHeader>
          <CardContent>
            {isDashboardLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading activity...</p>
              </div>
            ) : (dashboardData?.recentActivity?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentActivity.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'scan' ? 'bg-blue-500/10 text-blue-500' :
                        activity.type === 'mask' ? 'bg-green-500/10 text-green-500' :
                        'bg-purple-500/10 text-purple-500'
                      }`}>
                        {activity.type === 'scan' ? <FileText className="h-4 w-4" /> :
                         activity.type === 'mask' ? <Shield className="h-4 w-4" /> :
                         <Database className="h-4 w-4" />}
                      </div>
                      <span className="text-sm">{activity.description}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Connect a database and run a scan to see activity here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Index;
