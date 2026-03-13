-- Create projects table
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create database_connections table
CREATE TABLE public.database_connections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    db_type TEXT NOT NULL,
    host TEXT NOT NULL,
    port TEXT NOT NULL,
    database_name TEXT NOT NULL,
    username TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'disconnected',
    connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on database_connections
ALTER TABLE public.database_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for database_connections
CREATE POLICY "Users can view their own connections" 
ON public.database_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections" 
ON public.database_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" 
ON public.database_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" 
ON public.database_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create database_tables table
CREATE TABLE public.database_tables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    connection_id UUID NOT NULL REFERENCES public.database_connections(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    row_count INTEGER DEFAULT 0,
    column_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on database_tables
ALTER TABLE public.database_tables ENABLE ROW LEVEL SECURITY;

-- RLS policies for database_tables
CREATE POLICY "Users can view their own tables" 
ON public.database_tables 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tables" 
ON public.database_tables 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tables" 
ON public.database_tables 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tables" 
ON public.database_tables 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create pii_scans table
CREATE TABLE public.pii_scans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.database_tables(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    scan_status TEXT NOT NULL DEFAULT 'pending',
    total_fields_scanned INTEGER DEFAULT 0,
    pii_fields_found INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pii_scans
ALTER TABLE public.pii_scans ENABLE ROW LEVEL SECURITY;

-- RLS policies for pii_scans
CREATE POLICY "Users can view their own scans" 
ON public.pii_scans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scans" 
ON public.pii_scans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans" 
ON public.pii_scans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans" 
ON public.pii_scans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create detected_pii_fields table (stores field names only, no actual data)
CREATE TABLE public.detected_pii_fields (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scan_id UUID NOT NULL REFERENCES public.pii_scans(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    field_name TEXT NOT NULL,
    field_type TEXT NOT NULL,
    confidence INTEGER DEFAULT 0,
    table_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on detected_pii_fields
ALTER TABLE public.detected_pii_fields ENABLE ROW LEVEL SECURITY;

-- RLS policies for detected_pii_fields
CREATE POLICY "Users can view their own detected fields" 
ON public.detected_pii_fields 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own detected fields" 
ON public.detected_pii_fields 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own detected fields" 
ON public.detected_pii_fields 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create masking_history table
CREATE TABLE public.masking_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    fields_masked JSONB NOT NULL DEFAULT '[]',
    protection_method TEXT NOT NULL,
    technique TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    records_processed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on masking_history
ALTER TABLE public.masking_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for masking_history
CREATE POLICY "Users can view their own masking history" 
ON public.masking_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own masking history" 
ON public.masking_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create user_onboarding table to track first-time users
CREATE TABLE public.user_onboarding (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    has_completed_wizard BOOLEAN NOT NULL DEFAULT false,
    current_step INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_onboarding
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_onboarding
CREATE POLICY "Users can view their own onboarding" 
ON public.user_onboarding 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own onboarding" 
ON public.user_onboarding 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding" 
ON public.user_onboarding 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_database_connections_updated_at
BEFORE UPDATE ON public.database_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_onboarding_updated_at
BEFORE UPDATE ON public.user_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();