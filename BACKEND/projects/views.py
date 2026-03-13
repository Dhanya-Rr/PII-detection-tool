"""
Views for Project Management API.

All views require JWT authentication.
Users can only access their own projects.

Endpoints:
    - POST /api/projects/ - Create a new project
    - GET /api/projects/ - List user's projects
    - GET /api/projects/{id}/ - Get project details
    - POST /api/projects/{id}/select/ - Set as active project
    - DELETE /api/projects/{id}/delete/ - Delete a project
    - GET /api/projects/active/ - Get currently active project
    - POST /api/projects/{id}/scan/start/ - Start PII scan
    - GET /api/projects/{id}/scan/results/ - Get scan results
"""

import logging
from typing import Dict

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Project, UserProjectPreference, DetectedPIIField, DatabaseConnection
from .serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ActiveProjectSerializer,
    DetectedPIIFieldSerializer,
    DatabaseConnectionSerializer,
    DatabaseConnectionCreateSerializer,
)
from .pii_detector import detect_pii_from_sample_data, get_simulated_table_metadata, detect_pii_in_value, CONFIDENCE_SCORES
from .db_connectors import test_connection, fetch_tables_metadata, fetch_table_data

# Set up logger for debugging
logger = logging.getLogger(__name__)


class ProjectListCreateView(APIView):
    """
    API view for listing and creating projects.
    
    GET: List all projects owned by the authenticated user
    POST: Create a new project for the authenticated user
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        List all projects for the authenticated user.
        
        Returns projects ordered by creation date (newest first).
        Each project includes an 'is_active' flag indicating if it's
        the user's currently selected project.
        """
        projects = Project.objects.filter(owner=request.user)
        serializer = ProjectSerializer(
            projects,
            many=True,
            context={'request': request}
        )
        
        return Response({
            'projects': serializer.data,
            'count': projects.count()
        })
    
    def post(self, request):
        """
        Create a new project.
        
        Request body:
            - name (required): Project name
            - description (optional): Project description
        
        The authenticated user is automatically set as the owner.
        If this is the user's first project, it's automatically
        set as their active project.
        """
        # Debug logging
        logger.info(f"[PROJECT CREATE] User: {request.user.username}")
        logger.info(f"[PROJECT CREATE] Request data: {request.data}")
        logger.info(f"[PROJECT CREATE] Content-Type: {request.content_type}")
        logger.info(f"[PROJECT CREATE] Authorization header present: {'HTTP_AUTHORIZATION' in request.META}")
        
        serializer = ProjectCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            project = serializer.save()
            
            # If this is the user's first project, set it as active
            user_projects_count = Project.objects.filter(owner=request.user).count()
            if user_projects_count == 1:
                preference, _ = UserProjectPreference.objects.get_or_create(
                    user=request.user
                )
                preference.active_project = project
                preference.save()
            
            # Return the created project with full details
            response_serializer = ProjectSerializer(
                project,
                context={'request': request}
            )
            
            return Response({
                'message': 'Project created successfully',
                'project': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectDetailView(APIView):
    """
    API view for retrieving a single project's details.
    
    GET: Get project details by ID
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        """
        Get details of a specific project.
        
        Only the project owner can access this endpoint.
        """
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        serializer = ProjectSerializer(project, context={'request': request})
        return Response({'project': serializer.data})


class ProjectSelectView(APIView):
    """
    API view for selecting/activating a project.
    
    POST: Set the specified project as the user's active project
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id):
        """
        Set a project as the active project for the user.
        
        The project must exist and be owned by the authenticated user.
        This updates the user's project preference to mark this
        project as their current working context.
        """
        # Verify project exists and belongs to user
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        # Update or create user preference
        preference, created = UserProjectPreference.objects.get_or_create(
            user=request.user
        )
        preference.active_project = project
        preference.save()
        
        serializer = ProjectSerializer(project, context={'request': request})
        
        return Response({
            'message': f'Project "{project.name}" is now active',
            'project': serializer.data
        })


class ProjectDeleteView(APIView):
    """
    API view for deleting a project.
    
    DELETE: Delete the specified project
    """
    
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, project_id):
        """
        Delete a project.
        
        Only the project owner can delete their projects.
        If the deleted project was the active project, the active
        project is cleared (set to null).
        
        Note: This will cascade delete all related data.
        """
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        project_name = project.name
        
        # Check if this is the active project
        try:
            preference = UserProjectPreference.objects.get(user=request.user)
            if preference.active_project_id == project.id:
                # Clear active project since we're deleting it
                preference.active_project = None
                preference.save()
        except UserProjectPreference.DoesNotExist:
            pass
        
        # Delete the project
        project.delete()
        
        return Response({
            'message': f'Project "{project_name}" deleted successfully'
        })


class ActiveProjectView(APIView):
    """
    API view for getting the currently active project.
    
    GET: Retrieve the user's currently active project
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get the currently active project for the authenticated user.
        
        Returns null if no project is currently active.
        """
        try:
            preference = UserProjectPreference.objects.get(user=request.user)
            
            if preference.active_project:
                serializer = ProjectSerializer(
                    preference.active_project,
                    context={'request': request}
                )
                return Response({
                    'active_project': serializer.data
                })
            else:
                return Response({
                    'active_project': None,
                    'message': 'No active project selected'
                })
        
        except UserProjectPreference.DoesNotExist:
            return Response({
                'active_project': None,
                'message': 'No active project selected'
            })
    
    def delete(self, request):
        """
        Clear the active project (deselect current project).
        """
        try:
            preference = UserProjectPreference.objects.get(user=request.user)
            preference.active_project = None
            preference.save()
            return Response({
                'message': 'Active project cleared'
            })
        except UserProjectPreference.DoesNotExist:
            return Response({
                'message': 'No active project to clear'
            })


class ProjectStatsView(APIView):
    """
    API view for retrieving project statistics.
    
    GET: Get stats for a specific project (total scans, PII fields found, etc.)
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        """
        Get statistics for a specific project.
        
        Returns aggregated stats including:
        - total_scans: Number of scans performed
        - pii_fields_found: Total PII fields detected
        - data_masked: Amount of data masked
        - tables_scanned: Number of tables scanned
        
        Returns zeros if no scans have been performed yet.
        """
        # Verify project exists and belongs to user
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        # TODO: Replace with actual database queries when scan models are implemented
        # For now, return placeholder data (zeros)
        stats = {
            'total_scans': 0,
            'pii_fields_found': 0,
            'data_masked': 0,
            'tables_scanned': 0
        }
        
        return Response(stats)


class ProjectPIIDistributionView(APIView):
    """
    API view for retrieving PII type distribution for a project.
    
    GET: Get distribution of detected PII types
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        """
        Get PII type distribution for a specific project.
        
        Returns counts of each PII type detected:
        - email: Email addresses
        - phone: Phone numbers
        - ssn: Social Security Numbers
        - address: Physical addresses
        - name: Personal names
        
        Returns zeros if no PII has been detected yet.
        """
        # Verify project exists and belongs to user
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        # TODO: Replace with actual database queries when PII detection models are implemented
        # For now, return placeholder data (zeros)
        distribution = {
            'email': 0,
            'phone': 0,
            'ssn': 0,
            'address': 0,
            'name': 0
        }
        
        return Response(distribution)


class ProjectMaskingMethodsView(APIView):
    """
    API view for retrieving masking method usage statistics.
    
    GET: Get distribution of masking methods used in a project
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        """
        Get masking method distribution for a specific project.
        
        Returns counts of each masking method applied:
        - masking: Standard masking (e.g., replacing with asterisks)
        - redaction: Complete removal of data
        - pseudonymization: Replacing with fake but realistic data
        - tokenization: Replacing with tokens
        
        Returns zeros if no masking has been performed yet.
        """
        # Verify project exists and belongs to user
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        # TODO: Replace with actual database queries when masking models are implemented
        # For now, return placeholder data (zeros)
        methods = {
            'masking': 0,
            'redaction': 0,
            'pseudonymization': 0,
            'tokenization': 0
        }
        
        return Response(methods)


class ProjectActivityView(APIView):
    """
    API view for retrieving recent activity for a project.
    
    GET: Get list of recent activities/events for a project
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        """
        Get recent activity for a specific project.
        
        Returns a list of recent activities/events including:
        - Scans performed
        - Masking operations
        - Configuration changes
        
        Returns an empty list if no activities have been recorded yet.
        """
        # Verify project exists and belongs to user
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        # TODO: Replace with actual database queries when activity logging is implemented
        # For now, return empty activities list
        activities = {
            'activities': []
        }
        
        return Response(activities)


# ============================================================================
# DATABASE CONNECTION VIEWS (PHASE 4 - REAL DATABASE INTEGRATION)
# ============================================================================

class DatabaseConnectionCreateView(APIView):
    """
    API view for creating database connections.
    
    POST: Save a new database connection configuration for a project.
    
    The connection is created with status='pending' initially.
    Use the test endpoint to verify the connection.
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id):
        """
        Create a new database connection for a project.
        
        Request body:
            - db_type (required): Database type (postgres, mysql, mongodb, sqlite)
            - host (required): Database host address
            - port (optional): Database port
            - database_name (required): Name of the database
            - username (optional): Database username
            - password (optional): Database password
        
        The connection is created with status='pending' initially.
        Use the test endpoint to verify the connection.
        """
        # Validate project ownership
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        serializer = DatabaseConnectionCreateSerializer(
            data=request.data,
            context={'request': request, 'project': project}
        )
        
        if serializer.is_valid():
            connection = serializer.save()
            
            # Return created connection data
            response_serializer = DatabaseConnectionSerializer(connection)
            
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DatabaseConnectionTestView(APIView):
    """
    API view for testing database connections.
    
    POST: Test a real database connection using stored credentials.
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id, connection_id):
        """
        Test a database connection using real credentials.
        
        Behavior:
            - Connects to the actual database using stored credentials
            - Updates connection status to 'success' or 'failed'
            - Returns real connection result message
        """
        # Validate project ownership
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        # Get the connection (must belong to this project)
        connection = get_object_or_404(
            DatabaseConnection,
            id=connection_id,
            project=project
        )
        
        # Test real database connection
        try:
            success, message = test_connection(
                db_type=connection.db_type,
                host=connection.host,
                port=connection.port,
                database_name=connection.database_name,
                username=connection.username,
                password=connection.password
            )
            
            if success:
                connection.status = 'success'
                connection.save()
                
                logger.info(
                    f"[DB TEST] Connection {connection_id} successful for project {project_id}"
                )
                
                return Response({
                    'status': 'success',
                    'message': message
                }, status=status.HTTP_200_OK)
            else:
                connection.status = 'failed'
                connection.save()
                
                logger.warning(
                    f"[DB TEST] Connection {connection_id} failed for project {project_id}: {message}"
                )
                
                return Response({
                    'status': 'failed',
                    'message': message
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            connection.status = 'failed'
            connection.save()
            
            logger.error(
                f"[DB TEST] Connection {connection_id} error for project {project_id}: {str(e)}"
            )
            
            return Response({
                'status': 'failed',
                'message': f'Connection error: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class DatabaseConnectionTablesView(APIView):
    """
    API view for fetching database tables.
    
    GET: Return real table metadata from the connected database.
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id, connection_id):
        """
        Fetch real table metadata from a database connection.
        
        Requirements:
            - Connection must have status='success'
        
        Returns:
            - List of tables with their names
        """
        # Validate project ownership
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        # Get the connection (must belong to this project)
        connection = get_object_or_404(
            DatabaseConnection,
            id=connection_id,
            project=project
        )
        
        # Only allow if connection is established
        if connection.status != 'success':
            return Response(
                {'message': 'Connection not established. Please test the connection first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Fetch real table metadata
        try:
            tables = fetch_tables_metadata(
                db_type=connection.db_type,
                host=connection.host,
                port=connection.port,
                database_name=connection.database_name,
                username=connection.username,
                password=connection.password
            )
            
            logger.info(
                f"[DB TABLES] Fetched {len(tables)} tables from connection {connection_id}"
            )
            
            return Response({
                'tables': tables
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(
                f"[DB TABLES] Failed to fetch tables for connection {connection_id}: {str(e)}"
            )
            
            return Response({
                'message': f'Failed to fetch tables: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DatabaseTableDataView(APIView):
    """
    API view for fetching actual data rows from a database table.
    
    GET: Return data rows from the specified table.
    
    Endpoint: GET /api/projects/{project_id}/db-connections/{connection_id}/table-data/{table_name}/
    
    Query Parameters:
        - limit: Maximum number of rows to fetch (default: 100, max: 1000)
    """
    
    permission_classes = [IsAuthenticated]
    
    # List of allowed characters for table names (alphanumeric + underscore)
    VALID_TABLE_NAME_CHARS = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_')
    
    def _validate_table_name(self, table_name: str) -> bool:
        """
        Validate table name to prevent SQL injection.
        
        Only allows alphanumeric characters and underscores.
        """
        if not table_name or len(table_name) > 128:
            return False
        return all(c in self.VALID_TABLE_NAME_CHARS for c in table_name)
    
    def get(self, request, project_id, connection_id, table_name):
        """
        Fetch actual data rows from a database table.
        
        Args:
            project_id: UUID of the project
            connection_id: ID of the database connection
            table_name: Name of the table to fetch data from
        
        Query Parameters:
            limit: Max rows to return (default: 100, max: 1000)
        
        Returns:
            JSON array of row objects:
            [
                {"id": 1, "email": "user@gmail.com", "phone": "9876543210"},
                {"id": 2, "email": "john@yahoo.com", "phone": "9123456789"},
                ...
            ]
        """
        # Validate project ownership
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        # Get the connection (must belong to this project)
        connection = get_object_or_404(
            DatabaseConnection,
            id=connection_id,
            project=project
        )
        
        # Only allow if connection is established
        if connection.status != 'success':
            return Response(
                {'message': 'Connection not established. Please test the connection first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate table name to prevent SQL injection
        if not self._validate_table_name(table_name):
            logger.warning(
                f"[DB DATA] Invalid table name attempted: {table_name}"
            )
            return Response(
                {'message': 'Invalid table name. Only alphanumeric characters and underscores are allowed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get limit from query params (default 100, max 1000)
        try:
            limit = int(request.query_params.get('limit', 100))
            limit = max(1, min(limit, 1000))  # Clamp between 1 and 1000
        except ValueError:
            limit = 100
        
        # Fetch table data
        try:
            data = fetch_table_data(
                db_type=connection.db_type,
                host=connection.host,
                port=connection.port,
                database_name=connection.database_name,
                username=connection.username,
                password=connection.password,
                table_name=table_name,
                limit=limit
            )
            
            # Get column names from the first row (if data exists)
            columns = list(data[0].keys()) if data else []
            
            logger.info(
                f"[DB DATA] Fetched {len(data)} rows from table '{table_name}' "
                f"(connection {connection_id}, project {project_id})"
            )
            
            return Response({
                'table_name': table_name,
                'columns': columns,
                'row_count': len(data),
                'data': data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(
                f"[DB DATA] Failed to fetch data from table '{table_name}': {str(e)}"
            )
            
            return Response({
                'message': f'Failed to fetch table data: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StartScanView(APIView):
    """
    API view for starting a PII detection scan.
    
    POST: Start a rule-based PII scan on the project's connected database
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id):
        """
        Start a PII detection scan for a project.
        
        This endpoint:
            1. Validates project ownership
            2. Gets the connected database for the project
            3. Fetches all tables from the database
            4. For each table, fetches sample data (LIMIT 100)
            5. Applies regex detection on each cell value
            6. Saves detected PII fields to the database
        
        Returns:
            - message: Confirmation message
            - detected_fields: Count of detected PII fields
            - tables_scanned: Number of tables scanned
        """
        # Validate project ownership
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        # Clear any existing scan results for this project
        DetectedPIIField.objects.filter(project=project).delete()
        
        # Get the latest successful database connection for this project
        db_connection = DatabaseConnection.objects.filter(
            project=project,
            status='success'
        ).order_by('-created_at').first()
        
        if not db_connection:
            # Fallback to simulated data if no connection
            logger.warning(f"[PII SCAN] No database connection for project {project.name}, using simulated data")
            sample_tables = get_simulated_table_metadata()
            detected_pii = detect_pii_from_sample_data(sample_tables)
            
            created_fields = []
            for pii_data in detected_pii:
                field = DetectedPIIField.objects.create(
                    project=project,
                    table_name=pii_data['table_name'],
                    field_name=pii_data['field_name'],
                    pii_type=pii_data['pii_type'],
                    confidence=pii_data['confidence'],
                )
                created_fields.append(field)
            
            return Response({
                'message': 'Scan completed (simulated data)',
                'detected_fields': len(created_fields),
                'tables_scanned': len(sample_tables)
            }, status=status.HTTP_200_OK)
        
        # Scan real database
        try:
            # Fetch list of tables
            tables = fetch_tables_metadata(
                db_type=db_connection.db_type,
                host=db_connection.host,
                port=db_connection.port,
                database_name=db_connection.database_name,
                username=db_connection.username,
                password=db_connection.password
            )
            
            logger.info(f"[PII SCAN] Found {len(tables)} tables in database")
            
            # Track detected PII fields per column
            # Structure: {(table_name, field_name): {pii_type: count}}
            field_pii_counts: Dict[tuple, Dict[str, int]] = {}
            field_total_values: Dict[tuple, int] = {}
            
            # Scan each table
            for table_info in tables:
                table_name = table_info['table_name']
                
                try:
                    # Fetch sample data from this table
                    rows = fetch_table_data(
                        db_type=db_connection.db_type,
                        host=db_connection.host,
                        port=db_connection.port,
                        database_name=db_connection.database_name,
                        username=db_connection.username,
                        password=db_connection.password,
                        table_name=table_name,
                        limit=100
                    )
                    
                    if not rows:
                        logger.info(f"[PII SCAN] Table {table_name} has no data, skipping")
                        continue
                    
                    logger.info(f"[PII SCAN] Scanning {len(rows)} rows from table {table_name}")
                    
                    # Scan each row
                    for row in rows:
                        for field_name, value in row.items():
                            key = (table_name, field_name)
                            
                            # Initialize counters
                            if key not in field_pii_counts:
                                field_pii_counts[key] = {}
                                field_total_values[key] = 0
                            
                            field_total_values[key] += 1
                            
                            # Detect PII in this cell value
                            detected_types = detect_pii_in_value(value)
                            
                            for pii_type in detected_types:
                                if pii_type not in field_pii_counts[key]:
                                    field_pii_counts[key][pii_type] = 0
                                field_pii_counts[key][pii_type] += 1
                    
                except Exception as e:
                    logger.error(f"[PII SCAN] Error scanning table {table_name}: {str(e)}")
                    continue
            
            # Create DetectedPIIField records for fields with >= 50% detection rate
            created_fields = []
            for (table_name, field_name), pii_counts in field_pii_counts.items():
                total_values = field_total_values[(table_name, field_name)]
                
                for pii_type, count in pii_counts.items():
                    # Only save if PII detected in >= 50% of values
                    detection_rate = count / total_values if total_values > 0 else 0
                    
                    if detection_rate >= 0.5:
                        confidence = CONFIDENCE_SCORES.get(pii_type, CONFIDENCE_SCORES['default'])
                        
                        field = DetectedPIIField.objects.create(
                            project=project,
                            table_name=table_name,
                            field_name=field_name,
                            pii_type=pii_type,
                            confidence=confidence,
                        )
                        created_fields.append(field)
                        
                        logger.info(
                            f"[PII SCAN] Detected {pii_type} in {table_name}.{field_name} "
                            f"(rate: {detection_rate:.0%}, confidence: {confidence:.0%})"
                        )
            
            logger.info(
                f"[PII SCAN] Project {project.name}: Scanned {len(tables)} tables, "
                f"detected {len(created_fields)} PII fields"
            )
            
            return Response({
                'message': 'Scan completed',
                'detected_fields': len(created_fields),
                'tables_scanned': len(tables)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"[PII SCAN] Scan failed for project {project.name}: {str(e)}")
            return Response({
                'message': f'Scan failed: {str(e)}',
                'detected_fields': 0
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ScanResultsView(APIView):
    """
    API view for retrieving PII scan results.
    
    GET: Get all detected PII fields for a project
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        """
        Get all detected PII fields for a project.
        
        Returns all stored PII detection results for the specified project.
        Only the project owner can access this endpoint.
        
        Returns:
            - results: List of detected PII fields with details
            - count: Total number of detected fields
        """
        # Validate project ownership
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        # Get all detected PII fields for this project
        detected_fields = DetectedPIIField.objects.filter(project=project)
        
        serializer = DetectedPIIFieldSerializer(
            detected_fields,
            many=True,
            context={'request': request}
        )
        
        return Response({
            'results': serializer.data,
            'count': detected_fields.count()
        }, status=status.HTTP_200_OK)


# ============================================================================
# PHASE 6: MASKING & ANONYMIZATION ENGINE VIEWS
# ============================================================================

from django.http import StreamingHttpResponse, JsonResponse
from django.utils import timezone
from django.views import View
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import MaskingJob, MaskingField, MaskingLog
from .serializers import (
    MaskingJobSerializer,
    MaskingJobListSerializer,
    MaskingFieldSerializer,
    StartMaskingJobSerializer,
)
from .masking_service import (
    MaskingService,
    create_masking_job_from_detected_fields,
    get_strategy_for_pii_type,
    apply_masking,
    get_sample_for_pii_type,
)
import json
import time


class MaskingJobListView(APIView):
    """
    API view for listing masking jobs for a project.
    
    GET: List all masking jobs for a project
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        """
        List all masking jobs for a project.
        
        Returns jobs ordered by creation date (newest first).
        """
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        jobs = MaskingJob.objects.filter(project=project)
        serializer = MaskingJobListSerializer(jobs, many=True)
        
        return Response({
            'jobs': serializer.data,
            'count': jobs.count()
        }, status=status.HTTP_200_OK)


class MaskingJobDetailView(APIView):
    """
    API view for getting masking job details.
    
    GET: Get detailed information about a masking job
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id, job_id):
        """
        Get details of a specific masking job including fields and logs.
        """
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        job = get_object_or_404(
            MaskingJob,
            id=job_id,
            project=project
        )
        
        serializer = MaskingJobSerializer(job)
        
        return Response({
            'job': serializer.data
        }, status=status.HTTP_200_OK)


class StartMaskingJobView(APIView):
    """
    API view for starting a new masking job.
    
    POST: Create and start a new masking job
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id):
        """
        Start a new masking job for a project.
        
        This creates a masking job based on detected PII fields from Phase 5.
        Optionally specify a table_name to mask only that table.
        
        Request body (optional):
            - table_name: Specific table to mask (if not provided, masks all tables)
        
        Returns:
            - job_id: UUID of the created masking job
            - message: Status message
            - stream_url: URL for SSE progress stream
        """
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        serializer = StartMaskingJobSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        table_name = serializer.validated_data.get('table_name')
        field_configurations = serializer.validated_data.get('field_configurations', [])
        
        # Create masking job from detected fields with technique configurations
        job, fields_data = create_masking_job_from_detected_fields(
            project, 
            table_name, 
            field_configurations
        )
        
        if not job:
            return Response({
                'message': 'No detected PII fields found. Please run a scan first.',
                'detected_fields': 0
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(
            f"[MASKING] Created masking job {job.id} for project {project.name} "
            f"with {len(fields_data)} fields"
        )
        
        return Response({
            'job_id': str(job.id),
            'message': f'Masking job created with {len(fields_data)} fields',
            'total_fields': len(fields_data),
            'stream_url': f'/api/projects/{project_id}/masking/{job.id}/stream/',
        }, status=status.HTTP_201_CREATED)


class MaskingJobStreamView(View):
    """
    SSE view for streaming masking job progress.
    
    Uses Django's View (not DRF's APIView) to bypass content negotiation
    that causes 406 Not Acceptable errors with SSE.
    
    Authentication is done via JWT token in query parameter since
    EventSource API doesn't support custom headers.
    
    GET: Stream real-time progress updates for a masking job
    
    Usage:
        /api/projects/{project_id}/masking/{job_id}/stream/?token={jwt_token}
    """
    
    def _authenticate(self, request):
        """
        Authenticate user via JWT token from query parameter.
        
        Returns the user if authenticated, None otherwise.
        """
        # Try to get token from query parameter (for EventSource)
        token = request.GET.get('token')
        
        if not token:
            # Also try Authorization header (for fetch-based SSE)
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
        
        if not token:
            return None
        
        try:
            # Validate the JWT token
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            return user
        except (InvalidToken, TokenError) as e:
            logger.warning(f"[SSE Auth] Invalid token: {e}")
            return None
        except Exception as e:
            logger.error(f"[SSE Auth] Authentication error: {e}")
            return None
    
    def get(self, request, project_id, job_id):
        """
        Stream masking job progress using Server-Sent Events (SSE).
        
        This endpoint returns a streaming response that sends progress events
        as the masking job executes. The frontend should connect to this
        endpoint using EventSource API.
        
        Events are sent in SSE format:
            data: {"job_id": "...", "step": "...", "message": "..."}
        
        The stream closes when the job is completed.
        """
        # Authenticate user
        user = self._authenticate(request)
        if not user:
            return JsonResponse({
                'error': 'Authentication required',
                'detail': 'Please provide a valid JWT token via ?token= query parameter'
            }, status=401)
        
        # Get project (owned by authenticated user)
        try:
            project = Project.objects.get(id=project_id, owner=user)
        except Project.DoesNotExist:
            return JsonResponse({
                'error': 'Project not found',
                'detail': f'No project with id {project_id} found for this user'
            }, status=404)
        
        # Get masking job
        try:
            job = MaskingJob.objects.get(id=job_id, project=project)
        except MaskingJob.DoesNotExist:
            return JsonResponse({
                'error': 'Masking job not found',
                'detail': f'No masking job with id {job_id} found'
            }, status=404)
        
        # If job is already completed, return JSON status (not SSE)
        if job.status == 'completed':
            return JsonResponse({
                'message': 'Job already completed',
                'status': 'completed',
                'job_id': str(job.id),
            })
        
        if job.status == 'running':
            return JsonResponse({
                'error': 'Job is already running',
                'status': 'running',
                'job_id': str(job.id),
            }, status=409)
        
        def event_stream():
            """Generator for SSE events."""
            nonlocal job
            
            try:
                # Update job status to running
                job.status = 'running'
                job.started_at = timezone.now()
                job.save()
                
                # Audit Log: Job Started
                MaskingLog.objects.create(
                    job=job,
                    action='job_started',
                    step='analysis',
                    message='Masking job started',
                    level='info',
                    status='started',
                )
                
                # Get fields data
                fields_data = []
                for mf in job.masking_fields.all():
                    fields_data.append({
                        'table_name': mf.table_name,
                        'column_name': mf.column_name,
                        'pii_type': mf.pii_type,
                    })
                
                # Create masking service and execute
                service = MaskingService(job.id)
                
                for event in service.execute_masking(fields_data, delay_per_field=1.5):
                    step = event.get('step')
                    field_name = event.get('field')
                    event_status = event.get('status')
                    
                    # Create audit logs based on event type
                    if step == 'analysis':
                        MaskingLog.objects.create(
                            job=job,
                            action='analysis_started',
                            step='analysis',
                            message=event.get('message', 'Analyzing PII fields'),
                            level='info',
                            status='processing',
                        )
                    
                    elif step == 'strategy_selection':
                        if event.get('strategies'):
                            # Strategy selection completed
                            MaskingLog.objects.create(
                                job=job,
                                action='strategy_selected',
                                step='strategy_selection',
                                message=event.get('message', 'Strategies assigned'),
                                level='info',
                                status='processing',
                            )
                    
                    elif step == 'masking':
                        if event_status == 'processing' and field_name:
                            # Update field to processing status
                            mf = job.masking_fields.filter(column_name=field_name).first()
                            if mf:
                                mf.status = 'processing'
                                mf.save()
                            
                            # Audit Log: Masking Started for field with technique info
                            strategy_display = event.get('strategy_display', event.get('strategy', 'Unknown'))
                            MaskingLog.objects.create(
                                job=job,
                                action='masking_started',
                                step='masking',
                                message=f'Applying {strategy_display} to {field_name}',
                                level='info',
                                status='processing',
                                field_name=field_name,
                            )
                        
                        elif event_status == 'completed' and field_name:
                            job.processed_fields += 1
                            job.save()
                            
                            # Update masking field record
                            mf = job.masking_fields.filter(column_name=field_name).first()
                            if mf:
                                mf.status = 'completed'
                                mf.masked_sample = event.get('masked_sample', '')
                                mf.processed_at = timezone.now()
                                mf.save()
                            
                            # Audit Log: Masking Completed for field with technique info
                            strategy_display = event.get('strategy_display', event.get('strategy', 'Unknown'))
                            MaskingLog.objects.create(
                                job=job,
                                action='masking_completed',
                                step='masking',
                                message=f'{field_name} masked successfully using {strategy_display}',
                                level='success',
                                status='completed',
                                field_name=field_name,
                            )
                    
                    elif step == 'validation':
                        action = 'validation_started'
                        log_status = 'processing'
                        if event.get('validation_passed') is not None:
                            action = 'validation_completed'
                            log_status = 'completed'
                        
                        MaskingLog.objects.create(
                            job=job,
                            action=action,
                            step='validation',
                            message=event.get('message', 'Validating masked data'),
                            level='info',
                            status=log_status,
                        )
                    
                    # Yield SSE event
                    yield f"data: {json.dumps(event)}\n\n"
                
                # ============================================================
                # AUTO-EXECUTE: Process real database data after SSE completes
                # ============================================================
                # Send status update that real data processing is starting
                processing_event = {
                    'job_id': str(job.id),
                    'step': 'masking',
                    'message': 'Processing real database records...',
                    'progress': 95,
                    'timestamp': timezone.now().isoformat(),
                }
                yield f"data: {json.dumps(processing_event)}\n\n"
                
                try:
                    # Execute masking on real database data
                    from .masking_service import execute_masking_job
                    real_result = execute_masking_job(str(job.id))
                    
                    # Send completion event with real data stats
                    real_complete_event = {
                        'job_id': str(job.id),
                        'step': 'completed',
                        'message': f'Masked {real_result["rows_processed"]} rows across {real_result["tables_processed"]} tables',
                        'progress': 100,
                        'timestamp': timezone.now().isoformat(),
                        'tables_processed': real_result['tables_processed'],
                        'rows_processed': real_result['rows_processed'],
                        'datasets': real_result['datasets'],
                        'real_data_processed': True,
                    }
                    yield f"data: {json.dumps(real_complete_event)}\n\n"
                    
                    logger.info(f"[MASKING SSE] Real data processed: {real_result['rows_processed']} rows")
                    
                except Exception as real_err:
                    logger.error(f"[MASKING SSE] Real data processing failed: {str(real_err)}")
                    # Don't fail the job, just log the error - user can retry via execute endpoint
                    error_event = {
                        'job_id': str(job.id),
                        'step': 'warning',
                        'message': f'Real data processing deferred: {str(real_err)}',
                        'progress': 100,
                        'timestamp': timezone.now().isoformat(),
                        'real_data_processed': False,
                    }
                    yield f"data: {json.dumps(error_event)}\n\n"
                
                # Mark job as completed (may already be done by execute_masking_job)
                job.refresh_from_db()
                if job.status != 'completed':
                    job.status = 'completed'
                    job.completed_at = timezone.now()
                    job.save()
                
                # Audit Log: Job Completed
                MaskingLog.objects.create(
                    job=job,
                    action='job_completed',
                    step='completed',
                    message=f'Masking job completed - {job.total_fields} fields processed',
                    level='success',
                    status='completed',
                )
                
            except Exception as e:
                # Mark job as failed
                job.status = 'failed'
                job.save()
                
                # Audit Log: Job Failed
                MaskingLog.objects.create(
                    job=job,
                    action='job_failed',
                    step='masking',
                    message=f'Job failed: {str(e)}',
                    level='error',
                    status='error',
                )
                
                error_event = {
                    'job_id': str(job.id),
                    'step': 'error',
                    'message': f'Masking failed: {str(e)}',
                    'status': 'failed',
                }
                yield f"data: {json.dumps(error_event)}\n\n"
        
        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        response['Access-Control-Allow-Origin'] = '*'
        
        return response


class MaskingJobResultsView(APIView):
    """
    API view for getting final masking job results.
    
    GET: Get the final results of a completed masking job
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id, job_id):
        """
        Get the final results of a masking job.
        
        Returns the masked samples and status of each field.
        """
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        job = get_object_or_404(
            MaskingJob,
            id=job_id,
            project=project
        )
        
        fields = job.masking_fields.all()
        field_results = []
        
        for field in fields:
            field_results.append({
                'table_name': field.table_name,
                'column_name': field.column_name,
                'pii_type': field.pii_type,
                'masking_strategy': field.masking_strategy,
                'original_sample': field.original_sample,
                'masked_sample': field.masked_sample,
                'status': field.status,
            })
        
        return Response({
            'job_id': str(job.id),
            'status': job.status,
            'total_fields': job.total_fields,
            'processed_fields': job.processed_fields,
            'progress_percentage': job.progress_percentage,
            'results': field_results,
            'completed_at': job.completed_at.isoformat() if job.completed_at else None,
        }, status=status.HTTP_200_OK)


class PreviewMaskingView(APIView):
    """
    API view for previewing masking on sample data.
    
    POST: Preview how a value would be masked without saving
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id):
        """
        Preview masking on provided sample data.
        
        Request body:
            - value: The value to preview masking on
            - pii_type: Type of PII (email, phone, name, etc.)
        
        Returns:
            - original: Original value
            - masked: Masked value
            - strategy: Strategy used
        """
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        value = request.data.get('value', '')
        pii_type = request.data.get('pii_type', 'other')
        
        if not value:
            value = get_sample_for_pii_type(pii_type)
        
        strategy = get_strategy_for_pii_type(pii_type)
        masked_value = apply_masking(value, strategy)
        
        return Response({
            'original': value,
            'masked': masked_value,
            'strategy': strategy,
            'pii_type': pii_type,
        }, status=status.HTTP_200_OK)


# ============================================================================
# PHASE 7: AUDIT LOGS & EXECUTION CONSOLE VIEWS
# ============================================================================

from .serializers import AuditLogSerializer


class AuditLogsView(APIView):
    """
    API view for fetching audit logs for a masking job.
    
    GET: Get all audit logs for a specific masking job
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id, job_id):
        """
        Fetch all audit logs for a masking job.
        
        Returns logs ordered by timestamp (oldest first) for execution console display.
        """
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        job = get_object_or_404(
            MaskingJob,
            id=job_id,
            project=project
        )
        
        logs = job.logs.all().order_by('created_at')
        serializer = AuditLogSerializer(logs, many=True)
        
        return Response({
            'job_id': str(job.id),
            'status': job.status,
            'logs': serializer.data,
            'total_logs': logs.count(),
        }, status=status.HTTP_200_OK)


class AuditLogsStreamView(View):
    """
    SSE view for streaming audit logs in real-time.
    
    Uses Django's View (not DRF's APIView) to bypass content negotiation.
    Authentication via JWT token in query parameter.
    
    GET: Stream real-time audit logs for a masking job
    
    Usage:
        /api/projects/{project_id}/masking/{job_id}/logs/stream/?token={jwt_token}
    """
    
    def _authenticate(self, request):
        """
        Authenticate user via JWT token from query parameter.
        """
        token = request.GET.get('token')
        
        if not token:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
        
        if not token:
            return None
        
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            return user
        except (InvalidToken, TokenError) as e:
            logger.warning(f"[SSE Auth] Invalid token: {e}")
            return None
        except Exception as e:
            logger.error(f"[SSE Auth] Authentication error: {e}")
            return None
    
    def get(self, request, project_id, job_id):
        """
        Stream audit logs using Server-Sent Events (SSE).
        
        Continuously streams new log entries as they are created.
        Stream closes when the job is completed.
        """
        user = self._authenticate(request)
        if not user:
            return JsonResponse({
                'error': 'Authentication required',
                'detail': 'Please provide a valid JWT token via ?token= query parameter'
            }, status=401)
        
        try:
            project = Project.objects.get(id=project_id, owner=user)
        except Project.DoesNotExist:
            return JsonResponse({
                'error': 'Project not found',
                'detail': f'No project with id {project_id} found for this user'
            }, status=404)
        
        try:
            job = MaskingJob.objects.get(id=job_id, project=project)
        except MaskingJob.DoesNotExist:
            return JsonResponse({
                'error': 'Masking job not found',
                'detail': f'No masking job with id {job_id} found'
            }, status=404)
        
        def event_stream():
            """Generator for SSE log events."""
            last_log_id = 0
            check_interval = 0.5  # Check for new logs every 0.5 seconds
            max_iterations = 600  # Max 5 minutes of streaming
            iterations = 0
            
            while iterations < max_iterations:
                # Fetch new logs since last check
                new_logs = MaskingLog.objects.filter(
                    job=job,
                    id__gt=last_log_id
                ).order_by('id')
                
                for log in new_logs:
                    log_data = {
                        'timestamp': log.created_at.strftime('%H:%M:%S'),
                        'action': log.action,
                        'field': log.field_name,
                        'status': log.status,
                        'message': log.message,
                    }
                    yield f"data: {json.dumps(log_data)}\n\n"
                    last_log_id = log.id
                
                # Refresh job status from database
                job.refresh_from_db()
                
                # Check if job is completed or failed
                if job.status in ['completed', 'failed']:
                    # Send final status event
                    status_event = {
                        'type': 'job_status',
                        'status': job.status,
                        'message': f'Job {job.status}'
                    }
                    yield f"data: {json.dumps(status_event)}\n\n"
                    break
                
                time.sleep(check_interval)
                iterations += 1
        
        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        response['Access-Control-Allow-Origin'] = '*'
        
        return response


# ============================================================================
# PHASE 8: REAL DATA PROCESSING API VIEWS
# ============================================================================

from .masking_service import (
    execute_masking_job,
    export_masked_dataset_to_csv,
    export_masked_dataset_to_json,
    push_masked_data_to_database,
    get_masked_dataset_for_export,
)
from .models import MaskedDataset


class ExecuteMaskingJobView(APIView):
    """
    API view for executing a masking job on REAL database data.
    
    POST: Execute masking job with real data processing
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id, job_id):
        """
        Execute a masking job on real database records.
        
        This endpoint:
        1. Fetches real data from the connected database
        2. Applies masking techniques to PII fields
        3. Stores masked data in MaskedDataset model
        
        Returns:
            - job_id: UUID of the masking job
            - status: Job status
            - tables_processed: Number of tables processed
            - rows_processed: Total rows processed
            - datasets: List of processed datasets
        """
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        job = get_object_or_404(
            MaskingJob,
            id=job_id,
            project=project
        )
        
        # Check if job is already completed
        if job.status == 'completed':
            return Response({
                'message': 'Job already completed',
                'job_id': str(job.id),
                'status': job.status,
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if job.status == 'running':
            return Response({
                'message': 'Job is already running',
                'job_id': str(job.id),
                'status': job.status,
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Execute the masking job
            result = execute_masking_job(str(job_id))
            
            return Response({
                'message': 'Masking job executed successfully',
                'job_id': result['job_id'],
                'status': result['status'],
                'tables_processed': result['tables_processed'],
                'rows_processed': result['rows_processed'],
                'datasets': result['datasets'],
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"[EXECUTE JOB] Error: {str(e)}")
            return Response({
                'message': f'Failed to execute masking job: {str(e)}',
                'job_id': str(job.id),
                'status': 'failed',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExportMaskedDataView(APIView):
    """
    API view for exporting masked data to CSV or JSON.
    
    GET: Export masked dataset as CSV or JSON file
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id, job_id):
        """
        Export masked dataset as CSV or JSON.
        
        Query Parameters:
            - format: 'csv' or 'json' (default: csv)
            - table_name: Optional specific table to export
        
        Returns:
            - File download response with masked data
        """
        from django.http import HttpResponse
        
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        job = get_object_or_404(
            MaskingJob,
            id=job_id,
            project=project
        )
        
        # Get export format
        export_format = request.query_params.get('format', 'csv').lower()
        table_name = request.query_params.get('table_name')
        
        # Check if masked datasets exist
        datasets = MaskedDataset.objects.filter(job=job, status='completed')
        if not datasets.exists():
            return Response({
                'message': 'No masked datasets available. Execute the masking job first.',
                'job_id': str(job.id),
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if export_format == 'json':
                content = export_masked_dataset_to_json(str(job_id), table_name)
                content_type = 'application/json'
                filename = f'masked_data_{job_id[:8]}.json'
            else:
                content = export_masked_dataset_to_csv(str(job_id), table_name)
                content_type = 'text/csv'
                filename = f'masked_data_{job_id[:8]}.csv'
            
            response = HttpResponse(content, content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            # Log export action
            MaskingLog.objects.create(
                job=job,
                action='job_completed',
                step='completed',
                message=f'Export file ready: {filename}',
                level='success',
                status='completed',
            )
            
            return response
            
        except Exception as e:
            logger.error(f"[EXPORT] Error: {str(e)}")
            return Response({
                'message': f'Failed to export: {str(e)}',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PushMaskedDataView(APIView):
    """
    API view for pushing masked data back to the database.
    
    POST: Push masked data to database
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id, job_id):
        """
        Push masked data back to the source database.
        
        Request body:
            - mode: 'update' to update original table, 'insert' to create new masked table
                    (default: 'insert')
        
        Returns:
            - status: Operation status
            - tables_updated: Number of tables updated
            - rows_affected: Total rows affected
            - details: List of table-level results
        """
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        job = get_object_or_404(
            MaskingJob,
            id=job_id,
            project=project
        )
        
        # Get push mode from request
        mode = request.data.get('mode', 'insert')
        if mode not in ['update', 'insert']:
            return Response({
                'message': 'Invalid mode. Use "update" or "insert".',
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if masked datasets exist
        datasets = MaskedDataset.objects.filter(job=job, status='completed')
        if not datasets.exists():
            return Response({
                'message': 'No masked datasets available. Execute the masking job first.',
                'job_id': str(job.id),
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            result = push_masked_data_to_database(str(job_id), mode)
            
            return Response({
                'message': 'Database updated successfully' if result['status'] == 'completed' else 'Push operation failed',
                'status': result['status'],
                'tables_updated': result['tables_updated'],
                'rows_affected': result['rows_affected'],
                'details': result['details'],
            }, status=status.HTTP_200_OK if result['status'] == 'completed' else status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            logger.error(f"[PUSH] Error: {str(e)}")
            return Response({
                'message': f'Failed to push to database: {str(e)}',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MaskedDatasetsView(APIView):
    """
    API view for listing masked datasets for a job.
    
    GET: List all masked datasets for a masking job
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id, job_id):
        """
        List all masked datasets for a masking job.
        
        Returns basic info about each masked dataset (without full data).
        """
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        job = get_object_or_404(
            MaskingJob,
            id=job_id,
            project=project
        )
        
        datasets = MaskedDataset.objects.filter(job=job)
        
        dataset_info = []
        for ds in datasets:
            dataset_info.append({
                'id': ds.id,
                'table_name': ds.table_name,
                'original_row_count': ds.original_row_count,
                'masked_row_count': ds.masked_row_count,
                'column_mapping': ds.column_mapping,
                'status': ds.status,
                'created_at': ds.created_at.isoformat() if ds.created_at else None,
            })
        
        return Response({
            'job_id': str(job.id),
            'datasets': dataset_info,
            'total_datasets': len(dataset_info),
        }, status=status.HTTP_200_OK)


class MaskedDataPreviewView(APIView):
    """
    API view for previewing masked data (first few rows).
    
    GET: Preview masked data without downloading the full file
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id, job_id):
        """
        Preview masked data (first 10 rows per table).
        
        Query Parameters:
            - table_name: Optional specific table to preview
            - limit: Number of rows to preview (default: 10, max: 100)
        """
        project = get_object_or_404(
            Project,
            id=project_id,
            owner=request.user
        )
        
        job = get_object_or_404(
            MaskingJob,
            id=job_id,
            project=project
        )
        
        table_name = request.query_params.get('table_name')
        limit = min(int(request.query_params.get('limit', 10)), 100)
        
        datasets = MaskedDataset.objects.filter(job=job, status='completed')
        if table_name:
            datasets = datasets.filter(table_name=table_name)
        
        preview_data = []
        for ds in datasets:
            rows = ds.masked_data[:limit] if ds.masked_data else []
            columns = list(rows[0].keys()) if rows else []
            
            preview_data.append({
                'table_name': ds.table_name,
                'columns': columns,
                'rows': rows,
                'total_rows': ds.masked_row_count,
                'preview_count': len(rows),
            })
        
        return Response({
            'job_id': str(job.id),
            'tables': preview_data,
            'limit': limit,
        }, status=status.HTTP_200_OK)
