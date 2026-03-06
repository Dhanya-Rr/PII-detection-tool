"""
Django Base Settings for Data Masking and Anonymization Tool.

This file contains settings common to all environments.
Environment-specific settings are in dev.py and prod.py (future).

For more information on Django settings, see:
https://docs.djangoproject.com/en/4.2/topics/settings/
"""

from pathlib import Path

# =============================================================================
# PATH CONFIGURATION
# =============================================================================

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# BASE_DIR points to the BACKEND folder
BASE_DIR = Path(__file__).resolve().parent.parent.parent


# =============================================================================
# APPLICATION DEFINITION
# =============================================================================

# Django built-in apps
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

# Third-party apps
THIRD_PARTY_APPS = [
    'rest_framework',      # Django REST Framework for API development
    'rest_framework_simplejwt',  # JWT authentication
    'rest_framework_simplejwt.token_blacklist',  # Token blacklist for logout
    'corsheaders',         # CORS headers for frontend integration
]

# Local apps (created for this project)
LOCAL_APPS = [
    'core',                # Core app containing health check and base utilities
    'authentication',      # User authentication with JWT (Phase 2)
    'projects',            # Project management (Phase 3)
]

# Combine all apps
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


# =============================================================================
# MIDDLEWARE CONFIGURATION
# =============================================================================

MIDDLEWARE = [
    # CORS middleware must be placed as high as possible, especially before
    # CommonMiddleware or WhiteNoise. This ensures CORS headers are added
    # to all responses, including error responses.
    'corsheaders.middleware.CorsMiddleware',
    
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# =============================================================================
# URL CONFIGURATION
# =============================================================================

ROOT_URLCONF = 'backend.urls'


# =============================================================================
# TEMPLATE CONFIGURATION
# =============================================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# =============================================================================
# WSGI CONFIGURATION
# =============================================================================

WSGI_APPLICATION = 'backend.wsgi.application'


# =============================================================================
# PASSWORD VALIDATION
# =============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# =============================================================================
# INTERNATIONALIZATION
# =============================================================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# =============================================================================
# STATIC FILES CONFIGURATION
# =============================================================================

# URL prefix for static files
STATIC_URL = 'static/'


# =============================================================================
# DEFAULT PRIMARY KEY FIELD TYPE
# =============================================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# =============================================================================
# DJANGO REST FRAMEWORK CONFIGURATION
# =============================================================================

REST_FRAMEWORK = {
    # Default renderer classes - JSON is the primary format
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    
    # Default parser classes - Accept JSON input
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
    
    # JWT Authentication enabled globally (Phase 2)
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    
    # Default permission - authenticated users only
    # Individual views can override with AllowAny for public endpoints
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    
    # Exception handling
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}


# =============================================================================
# JWT CONFIGURATION (SimpleJWT)
# =============================================================================
# Note: SIGNING_KEY defaults to Django's SECRET_KEY if not specified.
# The SECRET_KEY is defined in environment-specific settings (dev.py, prod.py).

from datetime import timedelta

SIMPLE_JWT = {
    # Token lifetime settings
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),  # Access token valid for 1 hour
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # Refresh token valid for 7 days
    
    # Token rotation - get new refresh token when refreshing
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    
    # Algorithm (SIGNING_KEY defaults to SECRET_KEY)
    'ALGORITHM': 'HS256',
    
    # Token type and header
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    
    # User identification
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    # Token claims
    'TOKEN_TYPE_CLAIM': 'token_type',
    
    # Sliding token settings (disabled)
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=60),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}
