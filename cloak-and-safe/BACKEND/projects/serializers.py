"""
Serializers for Project management API.

Provides serialization/deserialization for:
    - Project creation and listing
    - Project selection
    - Active project status
    - Database connection management
"""

from rest_framework import serializers
from .models import Project, UserProjectPreference, DatabaseConnection, DetectedPIIField


class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for Project model.
    
    Used for:
        - Creating new projects (name required)
        - Listing projects (full details)
        - Project detail views
    
    The owner field is read-only and automatically set to the
    authenticated user during creation.
    """
    
    owner_username = serializers.CharField(
        source='owner.username',
        read_only=True,
        help_text="Username of the project owner"
    )
    
    is_active = serializers.SerializerMethodField(
        help_text="Whether this is the user's currently active project"
    )
    
    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'owner_username',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner_username', 'is_active', 'created_at', 'updated_at']
    
    def get_is_active(self, obj):
        """
        Check if this project is the active project for the requesting user.
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            try:
                preference = UserProjectPreference.objects.get(user=request.user)
                return preference.active_project_id == obj.id
            except UserProjectPreference.DoesNotExist:
                return False
        return False
    
    def validate_name(self, value):
        """
        Validate that project name is not empty and doesn't already exist for this user.
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Project name cannot be empty.")
        
        # Check for duplicate name for the same user
        request = self.context.get('request')
        if request and request.user:
            existing = Project.objects.filter(
                owner=request.user,
                name__iexact=value.strip()
            )
            # Exclude current instance if updating
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise serializers.ValidationError(
                    "You already have a project with this name."
                )
        
        return value.strip()


class ProjectCreateSerializer(serializers.ModelSerializer):
    """
    Serializer specifically for creating projects.
    
    Only requires the project name. Owner is set automatically
    from the authenticated user.
    """
    
    class Meta:
        model = Project
        fields = ['name', 'description']
    
    def validate_name(self, value):
        """Validate project name."""
        if not value or not value.strip():
            raise serializers.ValidationError("Project name cannot be empty.")
        
        request = self.context.get('request')
        if request and request.user:
            if Project.objects.filter(owner=request.user, name__iexact=value.strip()).exists():
                raise serializers.ValidationError(
                    "You already have a project with this name."
                )
        
        return value.strip()
    
    def create(self, validated_data):
        """Create project with the authenticated user as owner."""
        request = self.context.get('request')
        validated_data['owner'] = request.user
        return super().create(validated_data)


class ProjectSelectSerializer(serializers.Serializer):
    """
    Serializer for selecting/activating a project.
    
    Used with the select endpoint to set a project as the
    user's currently active project.
    """
    
    project_id = serializers.UUIDField(
        required=False,
        help_text="ID of the project to select (from URL)"
    )


class ActiveProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for returning the active project information.
    """
    
    active_project = ProjectSerializer(read_only=True)
    
    class Meta:
        model = UserProjectPreference
        fields = ['active_project', 'updated_at']


class DatabaseConnectionSerializer(serializers.ModelSerializer):
    """
    Serializer for DatabaseConnection model.
    
    Used for:
        - Creating new database connections
        - Listing connections for a project
        - Connection detail views
    
    Note: Password is write-only for security.
    For SQLite, host/port/username/password are optional.
    """
    
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        help_text="Database password (write-only)"
    )
    
    host = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Database host address (not required for SQLite)"
    )
    
    database_name = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Database name or file path (defaults to db.sqlite3 for SQLite)"
    )
    
    class Meta:
        model = DatabaseConnection
        fields = [
            'id',
            'db_type',
            'host',
            'port',
            'database_name',
            'username',
            'password',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']
    
    def validate_db_type(self, value):
        """Validate that db_type is one of the allowed choices."""
        valid_types = ['postgres', 'mysql', 'mongodb', 'sqlite']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Invalid database type. Must be one of: {', '.join(valid_types)}"
            )
        return value
    
    def validate(self, data):
        """Cross-field validation based on database type."""
        db_type = data.get('db_type', '')
        
        # SQLite doesn't require host, port, username, or password
        if db_type == 'sqlite':
            # For SQLite, database_name defaults to db.sqlite3 if not provided
            if not data.get('database_name'):
                data['database_name'] = 'db.sqlite3'
            # Set defaults for ignored fields
            data['host'] = data.get('host', 'localhost') or 'localhost'
            return data
        
        # For other database types, host and database_name are required
        host = data.get('host', '')
        database_name = data.get('database_name', '')
        
        if not host or not host.strip():
            raise serializers.ValidationError({
                'host': 'Host is required for this database type.'
            })
        
        if not database_name or not database_name.strip():
            raise serializers.ValidationError({
                'database_name': 'Database name is required for this database type.'
            })
        
        data['host'] = host.strip()
        data['database_name'] = database_name.strip()
        
        return data


class DatabaseConnectionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer specifically for creating database connections.
    
    For SQLite: only db_type is required (database_name defaults to db.sqlite3)
    For other DBs: db_type, host, and database_name are required.
    Project is set from the URL parameter.
    Password is write-only for security.
    """
    
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        help_text="Database password (write-only)"
    )
    
    host = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Database host address (not required for SQLite)"
    )
    
    database_name = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Database name or file path (defaults to db.sqlite3 for SQLite)"
    )
    
    class Meta:
        model = DatabaseConnection
        fields = ['db_type', 'host', 'port', 'database_name', 'username', 'password']
    
    def validate_db_type(self, value):
        """Validate that db_type is one of the allowed choices."""
        valid_types = ['postgres', 'mysql', 'mongodb', 'sqlite']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Invalid database type. Must be one of: {', '.join(valid_types)}"
            )
        return value
    
    def validate(self, data):
        """Cross-field validation based on database type."""
        db_type = data.get('db_type', '')
        
        # SQLite doesn't require host, port, username, or password
        if db_type == 'sqlite':
            # For SQLite, database_name defaults to db.sqlite3 if not provided
            if not data.get('database_name'):
                data['database_name'] = 'db.sqlite3'
            # Set defaults for ignored fields
            data['host'] = data.get('host', 'localhost') or 'localhost'
            return data
        
        # For other database types, host and database_name are required
        host = data.get('host', '')
        database_name = data.get('database_name', '')
        
        if not host or not host.strip():
            raise serializers.ValidationError({
                'host': 'Host is required for this database type.'
            })
        
        if not database_name or not database_name.strip():
            raise serializers.ValidationError({
                'database_name': 'Database name is required for this database type.'
            })
        
        data['host'] = host.strip()
        data['database_name'] = database_name.strip()
        
        return data
    
    def create(self, validated_data):
        """Create connection with the project from context."""
        project = self.context.get('project')
        validated_data['project'] = project
        validated_data['status'] = 'pending'  # Initial status is pending
        return super().create(validated_data)


class DetectedPIIFieldSerializer(serializers.ModelSerializer):
    """
    Serializer for DetectedPIIField model.
    
    Used for:
        - Listing detected PII fields for a project
        - Returning scan results
    """
    
    class Meta:
        model = DetectedPIIField
        fields = [
            'id',
            'project',
            'table_name',
            'field_name',
            'pii_type',
            'confidence',
            'created_at',
        ]
        read_only_fields = ['id', 'project', 'created_at']


# ============================================================================
# PHASE 6: MASKING SERIALIZERS
# ============================================================================

from .models import MaskingJob, MaskingField, MaskingLog


class MaskingLogSerializer(serializers.ModelSerializer):
    """Serializer for MaskingLog model (Audit Log)."""
    
    timestamp = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = MaskingLog
        fields = [
            'id',
            'action',
            'step',
            'message',
            'level',
            'status',
            'field_name',
            'timestamp',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'timestamp']


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer for audit log entries (ExecutionConsole format).
    
    Provides a clean format for displaying in the execution console.
    """
    
    timestamp = serializers.SerializerMethodField()
    field = serializers.CharField(source='field_name', allow_null=True)
    
    class Meta:
        model = MaskingLog
        fields = [
            'timestamp',
            'action',
            'field',
            'status',
            'message',
        ]
    
    def get_timestamp(self, obj):
        """Format timestamp as HH:MM:SS for console display."""
        if obj.created_at:
            return obj.created_at.strftime('%H:%M:%S')
        return None


class MaskingFieldSerializer(serializers.ModelSerializer):
    """Serializer for MaskingField model."""
    
    class Meta:
        model = MaskingField
        fields = [
            'id',
            'table_name',
            'column_name',
            'pii_type',
            'masking_strategy',
            'original_sample',
            'masked_sample',
            'status',
            'processed_at',
        ]
        read_only_fields = ['id', 'processed_at']


class MaskingJobSerializer(serializers.ModelSerializer):
    """Serializer for MaskingJob model with nested fields and logs."""
    
    masking_fields = MaskingFieldSerializer(many=True, read_only=True)
    logs = MaskingLogSerializer(many=True, read_only=True)
    progress_percentage = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = MaskingJob
        fields = [
            'id',
            'project',
            'database_name',
            'table_name',
            'status',
            'total_fields',
            'processed_fields',
            'progress_percentage',
            'created_at',
            'started_at',
            'completed_at',
            'masking_fields',
            'logs',
        ]
        read_only_fields = [
            'id', 'project', 'status', 'total_fields', 'processed_fields',
            'progress_percentage', 'created_at', 'started_at', 'completed_at',
        ]


class MaskingJobListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing masking jobs."""
    
    progress_percentage = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = MaskingJob
        fields = [
            'id',
            'database_name',
            'table_name',
            'status',
            'total_fields',
            'processed_fields',
            'progress_percentage',
            'created_at',
            'completed_at',
        ]
        read_only_fields = fields


class FieldConfigurationSerializer(serializers.Serializer):
    """Serializer for individual field masking configuration."""
    
    field_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="UUID of the detected PII field"
    )
    field_name = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Name of the field to mask"
    )
    table_name = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Name of the table containing the field"
    )
    technique = serializers.CharField(
        required=True,
        help_text="Masking/anonymization technique to apply"
    )
    method = serializers.ChoiceField(
        choices=['masking', 'anonymization'],
        required=False,
        help_text="Protection method type"
    )
    parameters = serializers.DictField(
        required=False,
        allow_empty=True,
        help_text="Additional parameters for the technique"
    )
    
    def validate_technique(self, value):
        """Validate that the technique is supported."""
        valid_techniques = [
            # Data Masking
            'partial_redaction', 'redaction', 'character_replacement', 'tokenization',
            'shuffling', 'nulling', 'date_masking', 'data_perturbation',
            # Anonymization
            'generalization', 'randomization', 'hashing', 'swapping',
            'noise_addition', 'k_anonymity', 'l_diversity',
            # Legacy
            'email_mask', 'phone_mask', 'name_mask', 'address_mask',
            'account_mask', 'card_mask', 'ssn_mask', 'aadhaar_mask',
            'pan_mask', 'generic_mask',
        ]
        if value not in valid_techniques:
            raise serializers.ValidationError(f"Invalid technique: {value}")
        return value


class StartMaskingJobSerializer(serializers.Serializer):
    """Serializer for starting a masking job."""
    
    table_name = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Optional: Specific table to mask. If not provided, masks all tables."
    )
    
    field_configurations = FieldConfigurationSerializer(
        many=True,
        required=False,
        help_text="Optional: Array of field-specific technique configurations."
    )
    
    def validate_table_name(self, value):
        if value == '':
            return None
        return value

