"""
Django Development Settings for Data Masking and Anonymization Tool.

This file contains settings specific to the development environment.
It imports all base settings and overrides/adds development-specific ones.

SECURITY WARNING: These settings are for DEVELOPMENT ONLY.
Do NOT use these settings in production!
"""

from .base import *

# =============================================================================
# ENVIRONMENT IDENTIFIER
# =============================================================================

ENVIRONMENT = 'development'


# =============================================================================
# SECURITY SETTINGS (DEVELOPMENT ONLY)
# =============================================================================

# SECURITY WARNING: keep the secret key used in production secret!
# This key is for development only. Generate a new one for production.
SECRET_KEY = 'django-insecure-dev-key-change-this-in-production-abc123xyz789'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Hosts allowed to access this Django instance
# In development, we allow localhost connections
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
]


# =============================================================================
# DATABASE CONFIGURATION (DEVELOPMENT)
# =============================================================================

# SQLite database for development - simple, no setup required
# For production, use PostgreSQL or another production-grade database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# =============================================================================
# CORS CONFIGURATION (FRONTEND INTEGRATION)
# =============================================================================

# Frontend application URL (Vite + React development server)
FRONTEND_URL = 'http://localhost:8080'

# List of origins that are allowed to make cross-origin requests
# In development, we only allow the React frontend
CORS_ALLOWED_ORIGINS = [
    'http://localhost:8080',      # Vite dev server (configured port)
    'http://127.0.0.1:8080',      # Alternative localhost
    'http://localhost:8081',      # Vite fallback port
    'http://127.0.0.1:8081',      # Alternative localhost fallback
    'http://localhost:5173',      # Vite dev server default port
    'http://127.0.0.1:5173',      # Alternative localhost
    'http://localhost:3000',      # Common React port (fallback)
    'http://127.0.0.1:3000',      # Alternative localhost
]

# Allow credentials (cookies, authorization headers) to be included
# in cross-origin requests. Required for session-based auth (future phases)
CORS_ALLOW_CREDENTIALS = True

# HTTP methods that are allowed for cross-origin requests
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# HTTP headers that are allowed in cross-origin requests
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Expose these headers to the frontend JavaScript
CORS_EXPOSE_HEADERS = [
    'content-type',
    'x-csrftoken',
]

# Cache preflight requests for 1 hour (3600 seconds)
CORS_PREFLIGHT_MAX_AGE = 3600


# =============================================================================
# DJANGO REST FRAMEWORK OVERRIDES (DEVELOPMENT)
# =============================================================================

# In development, enable the browsable API for easier debugging
# This adds HTML rendering capability alongside JSON
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # Inherit base settings
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',  # Enable for dev
    ],
}


# =============================================================================
# LOGGING CONFIGURATION (DEVELOPMENT)
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'core': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'projects': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'authentication': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}


# =============================================================================
# DEVELOPMENT-SPECIFIC SETTINGS
# =============================================================================

# Print emails to console instead of sending (for future auth features)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
