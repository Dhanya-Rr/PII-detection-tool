"""
URL configuration for Projects API.

All endpoints require JWT authentication.

Endpoints:
    POST   /api/projects/              - Create a new project
    GET    /api/projects/              - List user's projects
    GET    /api/projects/{id}/         - Get project details
    POST   /api/projects/{id}/select/  - Set as active project
    DELETE /api/projects/{id}/delete/  - Delete a project
    GET    /api/projects/active/       - Get currently active project
    DELETE /api/projects/active/       - Clear active project
    GET    /api/projects/{id}/stats/   - Get project statistics
    GET    /api/projects/{id}/pii-distribution/ - Get PII type distribution
    GET    /api/projects/{id}/masking-methods/  - Get masking method usage
    GET    /api/projects/{id}/activity/         - Get recent activity
    
    Database Connection (Phase 4 - Simulated):
    POST   /api/projects/{id}/db-connections/                - Save a database connection
    POST   /api/projects/{id}/db-connections/{conn_id}/test/ - Test connection (simulated)
    GET    /api/projects/{id}/db-connections/{conn_id}/tables/ - Fetch tables (simulated)
    
    PII Detection (Phase 5 - Rule-Based):
    POST   /api/projects/{id}/scan/start/   - Start PII detection scan
    GET    /api/projects/{id}/scan/results/ - Get scan results
    
    Masking & Anonymization (Phase 6):
    GET    /api/projects/{id}/masking/                  - List masking jobs
    POST   /api/projects/{id}/masking/start/            - Start masking job
    GET    /api/projects/{id}/masking/{job_id}/         - Get masking job details
    GET    /api/projects/{id}/masking/{job_id}/stream/  - Stream job progress (SSE)
    GET    /api/projects/{id}/masking/{job_id}/results/ - Get job results
    POST   /api/projects/{id}/masking/preview/          - Preview masking on sample
    
    Audit Logs & Execution Console (Phase 7):
    GET    /api/projects/{id}/masking/{job_id}/logs/         - Get audit logs for job
    GET    /api/projects/{id}/masking/{job_id}/logs/stream/  - Stream audit logs (SSE)
"""

from django.urls import path
from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    ProjectSelectView,
    ProjectDeleteView,
    ActiveProjectView,
    ProjectStatsView,
    ProjectPIIDistributionView,
    ProjectMaskingMethodsView,
    ProjectActivityView,
    DatabaseConnectionCreateView,
    DatabaseConnectionTestView,
    DatabaseConnectionTablesView,
    StartScanView,
    ScanResultsView,
    # Phase 6: Masking
    MaskingJobListView,
    MaskingJobDetailView,
    StartMaskingJobView,
    MaskingJobStreamView,
    MaskingJobResultsView,
    PreviewMaskingView,
    # Phase 7: Audit Logs
    AuditLogsView,
    AuditLogsStreamView,
)

app_name = 'projects'

urlpatterns = [
    # List projects and create new project
    path('', ProjectListCreateView.as_view(), name='project-list-create'),
    
    # Get active project
    path('active/', ActiveProjectView.as_view(), name='active-project'),
    
    # Project detail (must come after 'active/' to avoid UUID matching 'active')
    path('<uuid:project_id>/', ProjectDetailView.as_view(), name='project-detail'),
    
    # Select project as active
    path('<uuid:project_id>/select/', ProjectSelectView.as_view(), name='project-select'),
    
    # Delete project
    path('<uuid:project_id>/delete/', ProjectDeleteView.as_view(), name='project-delete'),
    
    # Project statistics and analytics
    path('<uuid:project_id>/stats/', ProjectStatsView.as_view(), name='project-stats'),
    path('<uuid:project_id>/pii-distribution/', ProjectPIIDistributionView.as_view(), name='project-pii-distribution'),
    path('<uuid:project_id>/masking-methods/', ProjectMaskingMethodsView.as_view(), name='project-masking-methods'),
    path('<uuid:project_id>/activity/', ProjectActivityView.as_view(), name='project-activity'),
    
    # Database Connection endpoints (Phase 4 - Simulated/Safe Mode)
    path('<uuid:project_id>/db-connections/', DatabaseConnectionCreateView.as_view(), name='db-connection-create'),
    path('<uuid:project_id>/db-connections/<int:connection_id>/test/', DatabaseConnectionTestView.as_view(), name='db-connection-test'),
    path('<uuid:project_id>/db-connections/<int:connection_id>/tables/', DatabaseConnectionTablesView.as_view(), name='db-connection-tables'),
    
    # PII Detection endpoints (Phase 5 - Rule-Based)
    path('<uuid:project_id>/scan/start/', StartScanView.as_view(), name='scan-start'),
    path('<uuid:project_id>/scan/results/', ScanResultsView.as_view(), name='scan-results'),
    
    # Masking & Anonymization endpoints (Phase 6)
    path('<uuid:project_id>/masking/', MaskingJobListView.as_view(), name='masking-jobs-list'),
    path('<uuid:project_id>/masking/start/', StartMaskingJobView.as_view(), name='masking-start'),
    path('<uuid:project_id>/masking/preview/', PreviewMaskingView.as_view(), name='masking-preview'),
    path('<uuid:project_id>/masking/<uuid:job_id>/', MaskingJobDetailView.as_view(), name='masking-job-detail'),
    path('<uuid:project_id>/masking/<uuid:job_id>/stream/', MaskingJobStreamView.as_view(), name='masking-job-stream'),
    path('<uuid:project_id>/masking/<uuid:job_id>/results/', MaskingJobResultsView.as_view(), name='masking-job-results'),
    
    # Audit Logs & Execution Console endpoints (Phase 7)
    path('<uuid:project_id>/masking/<uuid:job_id>/logs/', AuditLogsView.as_view(), name='masking-job-logs'),
    path('<uuid:project_id>/masking/<uuid:job_id>/logs/stream/', AuditLogsStreamView.as_view(), name='masking-job-logs-stream'),
]
