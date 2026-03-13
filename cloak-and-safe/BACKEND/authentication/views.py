"""
Authentication Views for Data Masking and Anonymization Tool.

This module contains API views for user authentication:
    - RegisterView: User registration endpoint
    - LoginView: User login with JWT token generation
    - LogoutView: Token invalidation (blacklist refresh token)
    - MeView: Get current authenticated user details

All views use Django REST Framework and SimpleJWT for token management.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer


class RegisterView(APIView):
    """
    User Registration API Endpoint.
    
    POST /api/auth/register/
    
    Creates a new user account with the provided credentials.
    Returns success message upon successful registration.
    
    Request Body:
        {
            "username": "string",
            "email": "string",
            "password": "string",
            "first_name": "string" (optional),
            "last_name": "string" (optional)
        }
    
    Response (201 Created):
        {
            "message": "User registered successfully",
            "user": {
                "id": 1,
                "username": "string",
                "email": "string",
                "first_name": "string",
                "last_name": "string",
                "date_joined": "datetime"
            }
        }
    
    Error Responses:
        400 Bad Request: Invalid data or validation errors
    """
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            user_data = UserSerializer(user).data
            
            return Response({
                'message': 'User registered successfully',
                'user': user_data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    User Login API Endpoint.
    
    POST /api/auth/login/
    
    Authenticates user and returns JWT tokens (access and refresh).
    Accepts either username or email for authentication.
    
    Request Body:
        {
            "username": "string (username or email)",
            "password": "string"
        }
    
    Response (200 OK):
        {
            "message": "Login successful",
            "tokens": {
                "access": "string (JWT access token)",
                "refresh": "string (JWT refresh token)"
            },
            "user": {
                "id": 1,
                "username": "string",
                "email": "string",
                "first_name": "string",
                "last_name": "string",
                "date_joined": "datetime"
            }
        }
    
    Error Responses:
        400 Bad Request: Invalid credentials or validation errors
    """
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token
            
            # Serialize user data
            user_data = UserSerializer(user).data
            
            return Response({
                'message': 'Login successful',
                'tokens': {
                    'access': str(access),
                    'refresh': str(refresh)
                },
                'user': user_data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    User Logout API Endpoint.
    
    POST /api/auth/logout/
    
    Invalidates the user's refresh token by adding it to the blacklist.
    Requires authentication via JWT access token.
    
    Request Headers:
        Authorization: Bearer <access_token>
    
    Request Body:
        {
            "refresh": "string (JWT refresh token)"
        }
    
    Response (200 OK):
        {
            "message": "Logout successful"
        }
    
    Error Responses:
        400 Bad Request: Invalid or missing refresh token
        401 Unauthorized: Invalid or expired access token
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                return Response({
                    'error': 'Refresh token is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Blacklist the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
            
        except TokenError as e:
            return Response({
                'error': 'Invalid or expired token'
            }, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """
    Current User Details API Endpoint.
    
    GET /api/auth/me/
    
    Returns the authenticated user's profile information.
    Requires authentication via JWT access token.
    
    Request Headers:
        Authorization: Bearer <access_token>
    
    Response (200 OK):
        {
            "user": {
                "id": 1,
                "username": "string",
                "email": "string",
                "first_name": "string",
                "last_name": "string",
                "date_joined": "datetime"
            }
        }
    
    Error Responses:
        401 Unauthorized: Invalid or expired access token
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_data = UserSerializer(request.user).data
        
        return Response({
            'user': user_data
        }, status=status.HTTP_200_OK)
