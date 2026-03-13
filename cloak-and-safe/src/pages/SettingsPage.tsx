import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Bell, Database } from "lucide-react";
import { toast } from "sonner";
import { useSearch } from "@/contexts/SearchContext";
import { useState, useCallback } from "react";

interface SettingsState {
  orgName: string;
  timezone: string;
  autoScan: boolean;
  saveHistory: boolean;
  piiAlerts: boolean;
  scanCompletion: boolean;
  exportReady: boolean;
  defaultDb: string;
  timeout: string;
}

const defaultSettings: SettingsState = {
  orgName: "",
  timezone: "utc",
  autoScan: true,
  saveHistory: true,
  piiAlerts: true,
  scanCompletion: true,
  exportReady: true,
  defaultDb: "mysql",
  timeout: "30",
};

const SettingsPage = () => {
  const { searchQuery } = useSearch();
  const [settings, setSettings] = useState<SettingsState>({ ...defaultSettings });

  const updateSetting = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    toast.success("Settings saved successfully!");
  }, []);

  const handleReset = useCallback(() => {
    setSettings({ ...defaultSettings });
    toast.info("Settings reset to defaults");
  }, []);

  const matchesSearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const showGeneral = matchesSearch("general") || matchesSearch("organization") || matchesSearch("timezone") || matchesSearch("scan");
  const showNotifications = matchesSearch("notification") || matchesSearch("alert") || matchesSearch("pii");
  const showDatabase = matchesSearch("database") || matchesSearch("connection") || matchesSearch("timeout");
  
  const hasResults = showGeneral || showNotifications || showDatabase;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your data masking preferences
          </p>
        </div>

        {!hasResults && searchQuery && (
          <p className="text-sm text-muted-foreground text-center py-8">No matching results found</p>
        )}

        {/* General Settings */}
        {showGeneral && (
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic application configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input 
                    id="orgName" 
                    placeholder="My Organization" 
                    value={settings.orgName}
                    onChange={(e) => updateSetting("orgName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => updateSetting("timezone", value)}>
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                      <SelectItem value="ist">India Standard Time (IST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-scan on connection</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically scan tables when database is connected
                  </p>
                </div>
                <Switch 
                  checked={settings.autoScan} 
                  onCheckedChange={(checked) => updateSetting("autoScan", checked)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Save scan history</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep a log of all PII detection scans
                  </p>
                </div>
                <Switch 
                  checked={settings.saveHistory} 
                  onCheckedChange={(checked) => updateSetting("saveHistory", checked)} 
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications */}
        {showNotifications && (
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure alert preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>PII Detection Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when new PII is detected
                  </p>
                </div>
                <Switch 
                  checked={settings.piiAlerts} 
                  onCheckedChange={(checked) => updateSetting("piiAlerts", checked)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Scan Completion</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when a scan is complete
                  </p>
                </div>
                <Switch 
                  checked={settings.scanCompletion} 
                  onCheckedChange={(checked) => updateSetting("scanCompletion", checked)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Export Ready</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when masked data export is ready
                  </p>
                </div>
                <Switch 
                  checked={settings.exportReady} 
                  onCheckedChange={(checked) => updateSetting("exportReady", checked)} 
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Database Defaults */}
        {showDatabase && (
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Database Defaults
              </CardTitle>
              <CardDescription>
                Default database connection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultDb">Default Database Type</Label>
                  <Select value={settings.defaultDb} onValueChange={(value) => updateSetting("defaultDb", value)}>
                    <SelectTrigger id="defaultDb">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="sqlserver">SQL Server</SelectItem>
                      <SelectItem value="oracle">Oracle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
                  <Input 
                    id="timeout" 
                    type="number" 
                    value={settings.timeout}
                    onChange={(e) => updateSetting("timeout", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="gradient-primary">
            Save Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
