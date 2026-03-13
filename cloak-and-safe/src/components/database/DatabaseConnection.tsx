import { useState, useEffect } from "react";
import { Database, Server, Lock, CheckCircle2, XCircle, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";
import {
  createDbConnection,
  testDbConnection,
  parseDatabaseError,
  type DatabaseType,
} from "@/api";

type ConnectionStatus = "idle" | "testing" | "connecting" | "connected" | "error";

interface ConnectionConfig {
  dbType: DatabaseType;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

// Default ports for different database types
const DEFAULT_PORTS: Record<DatabaseType, string> = {
  mysql: "3306",
  postgres: "5432",
  mongodb: "27017",
  sqlite: "",
};

interface DatabaseConnectionProps {
  onConnected: () => void;
}

export const DatabaseConnection = ({ onConnected }: DatabaseConnectionProps) => {
  const { currentProject, isConnected, setIsConnected, connectionId, setConnectionId } = useProject();
  const [status, setStatus] = useState<ConnectionStatus>(isConnected ? "connected" : "idle");
  const [config, setConfig] = useState<ConnectionConfig>({
    dbType: "mysql",
    host: "localhost",
    port: "3306",
    database: "",
    username: "",
    password: "",
  });

  // Check if current database type is SQLite
  const isSQLite = config.dbType === "sqlite";

  useEffect(() => {
    if (isConnected) {
      setStatus("connected");
    }
  }, [isConnected]);

  // Update port when database type changes
  const handleDbTypeChange = (value: DatabaseType) => {
    setConfig({
      ...config,
      dbType: value,
      port: DEFAULT_PORTS[value],
    });
    // Reset connection ID when changing type
    setConnectionId(null);
  };

  const handleTestConnection = async () => {
    // For non-SQLite, validate host
    if (!isSQLite && !config.host) {
      toast.error("Please enter a host");
      return;
    }

    if (!currentProject) {
      toast.error("Please select a project first");
      return;
    }

    setStatus("testing");
    
    try {
      // First create the connection if we don't have one
      let connId = connectionId;
      
      if (!connId) {
        // Build payload based on database type
        const payload = isSQLite
          ? {
              db_type: config.dbType,
              database_name: config.database || "db.sqlite3",
            }
          : {
              db_type: config.dbType,
              host: config.host,
              port: config.port ? parseInt(config.port) : undefined,
              database_name: config.database,
              username: config.username,
              password: config.password,
            };
        
        const connection = await createDbConnection(currentProject.id, payload);
        connId = connection.id;
        setConnectionId(connId);
      }
      
      // Test the connection via API
      const result = await testDbConnection(currentProject.id, connId);
      
      if (result.status === "success") {
        toast.success(result.message || "Connection test successful!");
      } else {
        toast.error(result.message || "Connection test failed");
      }
      
      setStatus("idle");
    } catch (error) {
      console.error("[DatabaseConnection] Test error:", error);
      const errorMessage = parseDatabaseError(error);
      toast.error(errorMessage);
      setStatus("error");
      // Reset to idle after showing error
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const handleConnect = async () => {
    // For non-SQLite, validate host
    if (!isSQLite && !config.host) {
      toast.error("Please enter a host");
      return;
    }

    if (!currentProject) {
      toast.error("Please select a project first");
      return;
    }

    setStatus("connecting");
    
    try {
      // Build payload based on database type
      const payload = isSQLite
        ? {
            db_type: config.dbType,
            database_name: config.database || "db.sqlite3",
          }
        : {
            db_type: config.dbType,
            host: config.host,
            port: config.port ? parseInt(config.port) : undefined,
            database_name: config.database,
            username: config.username,
            password: config.password,
          };
      
      // Create the database connection via API
      const connection = await createDbConnection(currentProject.id, payload);
      
      setConnectionId(connection.id);
      
      // Test the connection to set status to "success"
      const testResult = await testDbConnection(currentProject.id, connection.id);
      
      if (testResult.status === "success") {
        setStatus("connected");
        setIsConnected(true);
        onConnected();
        toast.success("Successfully connected to database!");
      } else {
        setStatus("error");
        toast.error(testResult.message || "Failed to establish connection");
        setTimeout(() => setStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("[DatabaseConnection] Connect error:", error);
      const errorMessage = parseDatabaseError(error);
      toast.error(errorMessage);
      setStatus("error");
      // Reset to idle after showing error
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const handleDisconnect = () => {
    setStatus("idle");
    setIsConnected(false);
    setConnectionId(null);
    toast.info("Disconnected from database");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "testing":
      case "connecting":
        return <Loader2 className="h-5 w-5 animate-spin text-warning" />;
      case "connected":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "error":
        return <XCircle className="h-5 w-5 text-danger" />;
      default:
        return <Database className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "testing":
        return "Testing...";
      case "connecting":
        return "Connecting...";
      case "connected":
        return "Connected";
      case "error":
        return "Connection Failed";
      default:
        return "Not Connected";
    }
  };

  return (
    <Card className="glass-effect">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Database Connection
            </CardTitle>
            <CardDescription>
              Connect to your MySQL, PostgreSQL, or other database
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dbType">Database Type</Label>
            <Select
              value={config.dbType}
              onValueChange={(value) => handleDbTypeChange(value as DatabaseType)}
              disabled={status === "connected"}
            >
              <SelectTrigger id="dbType">
                <SelectValue placeholder="Select database type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="postgres">PostgreSQL</SelectItem>
                <SelectItem value="mongodb">MongoDB</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Host - hidden for SQLite */}
          {!isSQLite && (
            <div className="space-y-2">
              <Label htmlFor="host">Host *</Label>
              <div className="relative">
                <Server className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="host"
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  placeholder="localhost"
                  className="pl-10"
                  disabled={status === "connected"}
                />
              </div>
            </div>
          )}

          {/* Port - hidden for SQLite */}
          {!isSQLite && (
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: e.target.value })}
                placeholder={DEFAULT_PORTS[config.dbType] || "3306"}
                disabled={status === "connected"}
              />
            </div>
          )}

          {/* Database Name / File Path */}
          <div className="space-y-2">
            <Label htmlFor="database">
              {isSQLite ? "Database File (optional)" : "Database Name *"}
            </Label>
            <div className="relative">
              {isSQLite && (
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              )}
              <Input
                id="database"
                value={config.database}
                onChange={(e) => setConfig({ ...config, database: e.target.value })}
                placeholder={isSQLite ? "db.sqlite3 (default)" : "my_database"}
                className={isSQLite ? "pl-10" : ""}
                disabled={status === "connected"}
              />
            </div>
            {isSQLite && (
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default Django database (db.sqlite3)
              </p>
            )}
          </div>

          {/* Username - hidden for SQLite */}
          {!isSQLite && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                placeholder="root"
                disabled={status === "connected"}
              />
            </div>
          )}

          {/* Password - hidden for SQLite */}
          {!isSQLite && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder="••••••••"
                  className="pl-10"
                  disabled={status === "connected"}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {status === "connected" ? (
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={status === "testing" || status === "connecting"}
              >
                {status === "testing" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Connection
              </Button>
              <Button
                onClick={handleConnect}
                disabled={status === "testing" || status === "connecting"}
                className="gradient-primary"
              >
                {status === "connecting" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {status === "connecting" ? "Connecting..." : "Connect"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
