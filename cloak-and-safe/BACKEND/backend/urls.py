"""
Main URL Configuration for Data Masking and Anonymization Tool Backend.

This module defines the root URL patterns for the Django backend.
All API endpoints are prefixed with /api/.

URL Structure:
    /api/           - API root with endpoint listing
    /api/health     - Health check endpoint (core app)
    /api/auth/      - Authentication endpoints (Phase 2)
    /admin/         - Django admin interface (development only)
    
Future phases will add:
    /api/masking/   - Data masking endpoints
    /api/detection/ - PII detection endpoints
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def api_root(request):
    """
    API Root endpoint.
    
    Returns a simple JSON response with available API endpoints.
    This helps developers discover available endpoints.
    """
    return JsonResponse({
        'message': 'Data Masking and Anonymization Tool API',
        'version': '3.0.0',
        'phase': 'Phase 3 - Project Management',
        'endpoints': {
            'health': '/api/health',
            'auth': {
                'register': '/api/auth/register/',
                'login': '/api/auth/login/',
                'logout': '/api/auth/logout/',
                'me': '/api/auth/me/',
                'refresh': '/api/auth/token/refresh/',
            },
            'projects': {
                'list': 'GET /api/projects/',
                'create': 'POST /api/projects/',
                'detail': 'GET /api/projects/{id}/',
                'select': 'POST /api/projects/{id}/select/',
                'delete': 'DELETE /api/projects/{id}/delete/',
                'active': 'GET /api/projects/active/',
                'stats': 'GET /api/projects/{id}/stats/',
                'pii_distribution': 'GET /api/projects/{id}/pii-distribution/',
                'masking_methods': 'GET /api/projects/{id}/masking-methods/',
                'activity': 'GET /api/projects/{id}/activity/',
            },
            'admin': '/admin/',
        }
    })


urlpatterns = [
    # Django Admin Interface (development only)
    # Access at: http://localhost:8000/admin/
    path('admin/', admin.site.urls),
    
    # API Root - informational endpoint
    # Access at: http://localhost:8000/api/
    path('api/', api_root, name='api-root'),
    
    # Core API endpoints (includes health check)
    # All core URLs are prefixed with /api/
    # Health check: GET /api/health
    path('api/', include('core.urls', namespace='core')),
    
    # Authentication API endpoints (Phase 2)
    # Handles user registration, login, logout, and profile
    # All auth URLs are prefixed with /api/auth/
    path('api/auth/', include('authentication.urls', namespace='authentication')),
    
    # Project Management API endpoints (Phase 3)
    # Handles project CRUD and active project selection
    # All project URLs are prefixed with /api/projects/
    path('api/projects/', include('projects.urls', namespace='projects')),
]
