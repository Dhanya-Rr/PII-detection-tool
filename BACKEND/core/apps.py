"""
Core app configuration.
"""

from django.apps import AppConfig


class CoreConfig(AppConfig):
    """
    Configuration for the Core application.
    
    This app contains:
    - Health check endpoint for frontend connectivity verification
    - Base utilities shared across other apps (future phases)
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    verbose_name = 'Core Application'
