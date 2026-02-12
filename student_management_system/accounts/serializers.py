from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from .models import Profile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'user_type', 'phone', 'is_verified', 'is_approved')
        read_only_fields = ('id', 'is_verified', 'is_approved')

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=False)
    
    class Meta:
        model = Profile
        fields = ('id', 'user', 'bio', 'avatar', 'date_of_birth', 'address')
        read_only_fields = ('id',)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user_serializer = UserSerializer(instance.user, data=user_data, partial=True)
            if user_serializer.is_valid(raise_exception=True):
                user_serializer.save()
        
        return super().update(instance, validated_data)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'user_type', 'phone')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username_or_email = attrs.get('username')
        password = attrs.get('password')

        if username_or_email and password:
            print(f"Attempting login for: {username_or_email}")
            # Try to authenticate with username
            user = authenticate(request=self.context.get('request'), username=username_or_email, password=password)
            
            # If failed, try to find user by email and authenticate with their username
            if not user:
                print(f"Username authentication failed, trying email...")
                try:
                    user_obj = User.objects.get(email=username_or_email)
                    print(f"Found user by email: {user_obj.username}")
                    user = authenticate(request=self.context.get('request'), username=user_obj.username, password=password)
                    if user:
                        print("Email authentication successful")
                    else:
                        print("Email authentication failed with found user's username")
                except (User.DoesNotExist, User.MultipleObjectsReturned):
                    print(f"No user found with email: {username_or_email}")
                    user = None

            if not user:
                msg = 'Unable to log in with provided credentials.'
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = 'Must include "username" and "password".'
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    
    def validate_new_password(self, value):
        # Add any custom password validation here
        return value
