"""
Authentication Serializers for Data Masking and Anonymization Tool.

This module contains serializers for user registration, login, and profile management.
Uses Django REST Framework serializers with Django's built-in User model.

Serializers:
    - UserSerializer: Serializes user data for responses
    - RegisterSerializer: Handles user registration with validation
    - LoginSerializer: Validates login credentials
"""

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.validators import UniqueValidator


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model.
    
    Used to serialize user data in API responses.
    Excludes sensitive fields like password.
    """
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class RegisterSerializer(serializers.Serializer):
    """
    Serializer for user registration.
    
    Validates registration data and creates new user accounts.
    Includes password validation using Django's built-in validators.
    
    Fields:
        - username: Required, must be unique
        - email: Required, must be unique and valid email format
        - password: Required, validated against Django password validators
        - first_name: Optional
        - last_name: Optional
    """
    
    username = serializers.CharField(
        required=True,
        min_length=3,
        max_length=150,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="A user with this username already exists."
            )
        ],
        help_text="Required. 3-150 characters."
    )
    
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="A user with this email already exists."
            )
        ],
        help_text="Required. Must be a valid email address."
    )
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text="Required. Minimum 8 characters."
    )
    
    first_name = serializers.CharField(
        required=False,
        max_length=150,
        allow_blank=True,
        default=""
    )
    
    last_name = serializers.CharField(
        required=False,
        max_length=150,
        allow_blank=True,
        default=""
    )
    
    def validate_password(self, value):
        """
        Validate password using Django's password validators.
        """
        validate_password(value)
        return value
    
    def validate_username(self, value):
        """
        Validate username format (alphanumeric and underscores only).
        """
        if not value.replace('_', '').replace('-', '').isalnum():
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, underscores, and hyphens."
            )
        return value.lower()  # Normalize to lowercase
    
    def validate_email(self, value):
        """
        Normalize email to lowercase.
        """
        return value.lower()
    
    def create(self, validated_data):
        """
        Create a new user with the validated data.
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    
    Accepts either username or email for login along with password.
    Returns the authenticated user object if credentials are valid.
    
    Fields:
        - username: Username or email address
        - password: User's password
    """
    
    username = serializers.CharField(
        required=True,
        help_text="Username or email address"
    )
    
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text="User's password"
    )
    
    def validate(self, attrs):
        """
        Validate login credentials.
        
        Attempts authentication using username first, then email if that fails.
        """
        username_or_email = attrs.get('username', '').lower()
        password = attrs.get('password')
        
        # Try to authenticate with username
        user = authenticate(username=username_or_email, password=password)
        
        # If username authentication fails, try email
        if not user:
            try:
                user_obj = User.objects.get(email=username_or_email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        
        if not user:
            raise serializers.ValidationError({
                'detail': 'Invalid credentials. Please check your username/email and password.'
            })
        
        if not user.is_active:
            raise serializers.ValidationError({
                'detail': 'This account has been deactivated.'
            })
        
        attrs['user'] = user
        return attrs
