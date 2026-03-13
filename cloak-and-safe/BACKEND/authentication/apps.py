"""
Authentication App Configuration.

This app handles user authentication using JWT tokens.
"""

from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    """Configuration for the authentication app."""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authentication'
    verbose_name = 'User Authentication'
