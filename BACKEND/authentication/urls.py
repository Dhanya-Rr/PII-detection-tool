"""
Authentication URL Configuration.

This module defines URL patterns for authentication endpoints.

URL Patterns:
    /api/auth/register/     POST    User registration
    /api/auth/login/        POST    User login (returns JWT tokens)
    /api/auth/logout/       POST    User logout (blacklist refresh token)
    /api/auth/me/           GET     Get current user details
    /api/auth/token/refresh/ POST   Refresh access token
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import RegisterView, LoginView, LogoutView, MeView


app_name = 'authentication'

urlpatterns = [
    # User registration
    path('register/', RegisterView.as_view(), name='register'),
    
    # User login - returns access and refresh tokens
    path('login/', LoginView.as_view(), name='login'),
    
    # User logout - blacklists refresh token
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # Get current authenticated user details
    path('me/', MeView.as_view(), name='me'),
    
    # Token refresh - get new access token using refresh token
    # This is provided by SimpleJWT
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]
