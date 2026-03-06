"""
Projects app configuration.

This app handles multi-project management for authenticated users.
Each user can create, list, select, and delete their own projects.
"""

from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'projects'
    verbose_name = 'Project Management'
