"""
Core URL Configuration.

This module defines URL patterns for the core app.
All URLs here are prefixed with /api/ in the main urls.py.
"""

from django.urls import path
from .views import HealthCheckView


# App namespace for URL reversing
app_name = 'core'

urlpatterns = [
    # Health check endpoint
    # Full URL: GET /api/health
    # Used by frontend to verify backend connectivity
    path('health', HealthCheckView.as_view(), name='health-check'),
]
