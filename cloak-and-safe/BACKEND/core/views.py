"""
Core Views for Data Masking and Anonymization Tool.

This module contains base API views including the health check endpoint
used by the frontend to verify backend connectivity.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings


class HealthCheckView(APIView):
    """
    Health Check API Endpoint.
    
    This endpoint is used by the React frontend to verify that the
    backend server is running and accessible. It returns basic
    service information without requiring authentication.
    
    Endpoint: GET /api/health
    
    Response:
        {
            "status": "ok",
            "service": "Data Masking Backend",
            "environment": "development"
        }
    
    Status Codes:
        200: Backend is healthy and responding
    """
    
    # No authentication required for health check
    authentication_classes = []
    permission_classes = []
    
    def get(self, request):
        """
        Handle GET request for health check.
        
        Returns JSON response with service status, name, and environment.
        This endpoint is called by the frontend to confirm backend connectivity.
        
        Args:
            request: The HTTP request object
            
        Returns:
            Response: JSON response with health status
        """
        # Get environment from settings, default to 'unknown' if not set
        environment = getattr(settings, 'ENVIRONMENT', 'unknown')
        
        # Construct health check response
        health_data = {
            'status': 'ok',
            'service': 'Data Masking Backend',
            'environment': environment,
        }
        
        return Response(health_data, status=status.HTTP_200_OK)
