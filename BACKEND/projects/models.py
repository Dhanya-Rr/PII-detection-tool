"""
Project models for multi-project management.

Models:
    - Project: Core project entity owned by a user
    - UserProjectPreference: Tracks user's active/selected project
"""

import uuid
from django.db import models
from django.conf import settings


class Project(models.Model):
    """
    Project model representing a user's data masking project.
    
    Each project belongs to a single authenticated user (owner).
    Users can only access and manage their own projects.
    
    Attributes:
        id: UUID primary key for unique identification
        name: Human-readable project name
        owner: Foreign key to the User who owns this project
        description: Optional project description
        created_at: Timestamp when project was created
        updated_at: Timestamp of last modification
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the project"
    )
    
    name = models.CharField(
        max_length=255,
        help_text="Project name"
    )
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects',
        help_text="User who owns this project"
    )
    
    description = models.TextField(
        blank=True,
        default='',
        help_text="Optional project description"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the project was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When the project was last updated"
    )
    
    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
        # Ensure unique project names per user
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'name'],
                name='unique_project_name_per_user'
            )
        ]
    
    def __str__(self):
        return f"{self.name} (Owner: {self.owner.username})"


class UserProjectPreference(models.Model):
    """
    Stores user preferences including their currently active project.
    
    This model maintains a one-to-one relationship with User to track
    which project is currently selected/active for each user.
    
    Attributes:
        user: One-to-one link to the User
        active_project: Currently selected project (nullable)
        updated_at: When preference was last changed
    """
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_preference',
        help_text="User whose preference this is"
    )
    
    active_project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='active_for_users',
        help_text="Currently selected/active project"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When preference was last updated"
    )
    
    class Meta:
        db_table = 'user_project_preferences'
        verbose_name = 'User Project Preference'
        verbose_name_plural = 'User Project Preferences'
    
    def __str__(self):
        project_name = self.active_project.name if self.active_project else 'None'
        return f"{self.user.username}'s active project: {project_name}"


class DatabaseConnection(models.Model):
    """
    Model representing a real database connection configuration for a project.
    
    Stores credentials and connection details for connecting to external databases.
    Supports PostgreSQL, MySQL, SQLite, and MongoDB.
    
    Attributes:
        id: Auto-incrementing primary key
        project: The project this connection belongs to
        db_type: Type of database (postgres, mysql, mongodb, sqlite)
        host: Database host address
        port: Database port (optional, uses default if not specified)
        database_name: Name of the database to connect to
        username: Database username
        password: Database password (plain text for academic project)
        status: Connection status (pending, success, failed)
        created_at: Timestamp when connection was created
    
    NOTE: For production, password should be encrypted. Keeping simple for academic purposes.
    """
    
    DB_TYPE_CHOICES = [
        ('postgres', 'PostgreSQL'),
        ('mysql', 'MySQL'),
        ('mongodb', 'MongoDB'),
        ('sqlite', 'SQLite'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='db_connections',
        help_text="Project this database connection belongs to"
    )
    
    db_type = models.CharField(
        max_length=20,
        choices=DB_TYPE_CHOICES,
        help_text="Type of database"
    )
    
    host = models.CharField(
        max_length=255,
        help_text="Database host address"
    )
    
    port = models.IntegerField(
        null=True,
        blank=True,
        help_text="Database port (optional, uses default if not specified)"
    )
    
    database_name = models.CharField(
        max_length=255,
        default='',
        help_text="Name of the database to connect to"
    )
    
    username = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="Database username"
    )
    
    password = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="Database password (stored as plain text for academic purposes)"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Connection status"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the connection was created"
    )
    
    class Meta:
        db_table = 'database_connections'
        ordering = ['-created_at']
        verbose_name = 'Database Connection'
        verbose_name_plural = 'Database Connections'
    
    def __str__(self):
        return f"{self.db_type} connection to {self.host}:{self.database_name} ({self.status})"


class DetectedPIIField(models.Model):
    """
    Model representing a detected PII field from scanning.
    
    Stores the results of rule-based PII detection scans on project data.
    Each record represents a single field that was identified as containing
    potential PII data.
    
    Attributes:
        project: The project this detection belongs to
        table_name: Name of the table containing the PII field
        field_name: Name of the field/column containing PII
        pii_type: Type of PII detected (email, phone, card, ssn, etc.)
        confidence: Confidence score of the detection (0.0 to 1.0)
        created_at: Timestamp when the detection was recorded
    """
    
    PII_TYPE_CHOICES = [
        ('email', 'Email Address'),
        ('phone', 'Phone Number'),
        ('card', 'Credit Card'),
        ('ssn', 'Social Security Number'),
        ('name', 'Personal Name'),
        ('address', 'Physical Address'),
        ('aadhaar', 'Aadhaar Number'),
        ('pan', 'PAN Card'),
        ('other', 'Other PII'),
    ]
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='detected_pii_fields',
        help_text="Project this detected PII field belongs to"
    )
    
    table_name = models.CharField(
        max_length=255,
        help_text="Name of the table containing the PII field"
    )
    
    field_name = models.CharField(
        max_length=255,
        help_text="Name of the field/column containing PII"
    )
    
    pii_type = models.CharField(
        max_length=50,
        choices=PII_TYPE_CHOICES,
        help_text="Type of PII detected (email, phone, card, ssn, etc.)"
    )
    
    confidence = models.FloatField(
        help_text="Confidence score of the detection (0.0 to 1.0)"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the detection was recorded"
    )
    
    class Meta:
        db_table = 'detected_pii_fields'
        ordering = ['-created_at']
        verbose_name = 'Detected PII Field'
        verbose_name_plural = 'Detected PII Fields'
    
    def __str__(self):
        return f"{self.table_name}.{self.field_name} ({self.pii_type}, {self.confidence:.0%})"


# ============================================================================
# PHASE 6: MASKING & ANONYMIZATION ENGINE MODELS
# ============================================================================

class MaskingJob(models.Model):
    """
    Model representing a masking job for processing detected PII fields.
    
    A masking job processes all detected PII fields for a project,
    applying appropriate masking strategies to each field.
    
    Attributes:
        id: UUID primary key for unique identification
        project: The project this masking job belongs to
        database_name: Name of the database being processed
        table_name: Name of the table being processed (optional, null = all tables)
        status: Job status (pending, running, completed, failed)
        total_fields: Total number of fields to process
        processed_fields: Number of fields processed so far
        created_at: Timestamp when job was created
        started_at: Timestamp when job started processing
        completed_at: Timestamp when job completed
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the masking job"
    )
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='masking_jobs',
        help_text="Project this masking job belongs to"
    )
    
    database_name = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="Name of the database being processed"
    )
    
    table_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Name of the specific table being processed (null = all tables)"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current status of the masking job"
    )
    
    total_fields = models.IntegerField(
        default=0,
        help_text="Total number of PII fields to process"
    )
    
    processed_fields = models.IntegerField(
        default=0,
        help_text="Number of fields processed so far"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the job was created"
    )
    
    started_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the job started processing"
    )
    
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the job completed"
    )
    
    class Meta:
        db_table = 'masking_jobs'
        ordering = ['-created_at']
        verbose_name = 'Masking Job'
        verbose_name_plural = 'Masking Jobs'
    
    def __str__(self):
        return f"MaskingJob {self.id} ({self.status})"
    
    @property
    def progress_percentage(self):
        """Calculate progress percentage."""
        if self.total_fields == 0:
            return 0
        return int((self.processed_fields / self.total_fields) * 100)


class MaskingField(models.Model):
    """
    Model representing an individual field being masked within a job.
    
    Each MaskingField corresponds to a detected PII field and tracks
    the masking strategy used and processing status.
    
    Attributes:
        job: The masking job this field belongs to
        detected_field: Reference to the detected PII field
        table_name: Name of the table containing the field
        column_name: Name of the column being masked
        pii_type: Type of PII (for quick access)
        masking_strategy: Strategy used for masking
        original_sample: Sample of original data (for preview)
        masked_sample: Sample of masked data (for preview)
        status: Processing status
        processed_at: Timestamp when processing completed
    """
    
    STRATEGY_CHOICES = [
        ('email_mask', 'Email Masking'),
        ('phone_mask', 'Phone Masking'),
        ('name_mask', 'Name Masking'),
        ('address_mask', 'Address Masking'),
        ('account_mask', 'Account Number Masking'),
        ('card_mask', 'Credit Card Masking'),
        ('ssn_mask', 'SSN Masking'),
        ('aadhaar_mask', 'Aadhaar Masking'),
        ('pan_mask', 'PAN Card Masking'),
        ('generic_mask', 'Generic Masking'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    job = models.ForeignKey(
        MaskingJob,
        on_delete=models.CASCADE,
        related_name='masking_fields',
        help_text="Masking job this field belongs to"
    )
    
    detected_field = models.ForeignKey(
        DetectedPIIField,
        on_delete=models.CASCADE,
        related_name='masking_records',
        null=True,
        blank=True,
        help_text="Reference to the detected PII field"
    )
    
    table_name = models.CharField(
        max_length=255,
        help_text="Name of the table containing the field"
    )
    
    column_name = models.CharField(
        max_length=255,
        help_text="Name of the column being masked"
    )
    
    pii_type = models.CharField(
        max_length=50,
        help_text="Type of PII in this field"
    )
    
    masking_strategy = models.CharField(
        max_length=50,
        choices=STRATEGY_CHOICES,
        default='generic_mask',
        help_text="Masking strategy applied to this field"
    )
    
    original_sample = models.TextField(
        blank=True,
        default='',
        help_text="Sample of original data (for preview)"
    )
    
    masked_sample = models.TextField(
        blank=True,
        default='',
        help_text="Sample of masked data (for preview)"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Processing status of this field"
    )
    
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When processing completed"
    )
    
    class Meta:
        db_table = 'masking_fields'
        ordering = ['id']
        verbose_name = 'Masking Field'
        verbose_name_plural = 'Masking Fields'
    
    def __str__(self):
        return f"{self.table_name}.{self.column_name} ({self.masking_strategy})"


class MaskingLog(models.Model):
    """
    Model for logging masking job progress and events.
    
    Provides detailed logging of each step in the masking process
    for debugging and audit purposes. Also serves as the audit log
    for enterprise-grade traceability.
    
    Attributes:
        job: The masking job this log belongs to
        action: Specific action being performed
        step: Current processing step (phase)
        message: Log message
        level: Log level (info, warning, error, success)
        status: Action status (started, processing, completed, error)
        field_name: Name of field being processed (if applicable)
        created_at: Timestamp of the log entry
    """
    
    LEVEL_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('success', 'Success'),
    ]
    
    STEP_CHOICES = [
        ('analysis', 'Analysis'),
        ('strategy_selection', 'Strategy Selection'),
        ('masking', 'Masking'),
        ('validation', 'Validation'),
        ('completed', 'Completed'),
    ]
    
    ACTION_CHOICES = [
        ('job_started', 'Job Started'),
        ('analysis_started', 'Analysis Started'),
        ('analysis_completed', 'Analysis Completed'),
        ('strategy_selected', 'Strategy Selected'),
        ('masking_started', 'Masking Started'),
        ('masking_completed', 'Masking Completed'),
        ('validation_started', 'Validation Started'),
        ('validation_completed', 'Validation Completed'),
        ('job_completed', 'Job Completed'),
        ('job_failed', 'Job Failed'),
    ]
    
    STATUS_CHOICES = [
        ('started', 'Started'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('error', 'Error'),
    ]
    
    job = models.ForeignKey(
        MaskingJob,
        on_delete=models.CASCADE,
        related_name='logs',
        help_text="Masking job this log belongs to"
    )
    
    action = models.CharField(
        max_length=50,
        choices=ACTION_CHOICES,
        default='job_started',
        help_text="Specific action being performed"
    )
    
    step = models.CharField(
        max_length=50,
        choices=STEP_CHOICES,
        help_text="Current processing step"
    )
    
    message = models.TextField(
        help_text="Log message"
    )
    
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default='info',
        help_text="Log level"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='processing',
        help_text="Action status"
    )
    
    field_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Name of field being processed (if applicable)"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this log entry was created"
    )
    
    class Meta:
        db_table = 'masking_logs'
        ordering = ['created_at']
        verbose_name = 'Masking Log'
        verbose_name_plural = 'Masking Logs'
    
    def __str__(self):
        return f"[{self.action}] {self.message}"