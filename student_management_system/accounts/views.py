from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from .models import User, Profile, VerificationToken, PasswordResetToken
from .serializers import UserSerializer, ProfileSerializer, RegisterSerializer, LoginSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer
import uuid
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import secrets
import string

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_tutor(request, user_id):
    """
    Approve a tutor account (Admin only)
    """
    if request.user.user_type != 'admin' and not request.user.is_staff:
        return Response({'error': 'Only admins can approve tutors'}, status=status.HTTP_403_FORBIDDEN)
        
    user = get_object_or_404(User, id=user_id, user_type='tutor')
    user.is_approved = True
    user.save()
    
    # Send email notification
    send_mail(
        'Tutor Account Approved',
        f'Hello {user.username},\n\nYour tutor account has been approved. You can now create courses and start teaching.\n\nBest regards,\nEduSystem Team',
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )
    
    return Response({'message': f'Tutor {user.username} has been approved.'})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Create profile for the user
        Profile.objects.create(user=user)
        # Create verification token
        token = str(uuid.uuid4())
        expires_at = timezone.now() + timedelta(hours=24)
        VerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
        
        # Send verification email
        send_verification_email(user, token)
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'User registered successfully.',
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def send_verification_email(user, token):
    """Send verification email to the user"""
    subject = 'Verify your email address'
    verification_url = f'{settings.FRONTEND_URL}/verify-email/{token}'
    
    html_message = render_to_string('emails/verification_email.html', {
        'user': user,
        'verification_url': verification_url,
        'token': token,
    })
    
    text_message = f'''
    Hello {user.first_name or user.username},
    
    Thank you for registering. Please click the link below to verify your email address:
    
    {verification_url}
    
    Or enter this verification code: {token}
    
    This link/code will expire in 24 hours.
    
    Best regards,
    EduSystem Pro Team
    '''
    
    try:
        send_mail(
            subject,
            text_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            html_message=html_message,
            fail_silently=True,
        )
    except Exception as e:
        print(f"Error sending email: {e}")

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    try:
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            from django.contrib.auth import login as django_login
            django_login(request, user)
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        
        print(f"Login validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Unexpected error during login: {str(e)}\n{error_trace}")
        return Response({
            'error': 'Unexpected Server Error',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_login_otp(request):
    """Send OTP for login"""
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
    # Generate OTP
    otp = ''.join(secrets.choice(string.digits) for _ in range(6))
    
    # Store OTP in profile (or verification token)
    # Ideally, we should have a field for OTP in profile or a separate model
    # For now, let's use VerificationToken with a special type or just update profile if it has otp field
    # But Profile doesn't seem to have otp field in the snippet I saw.
    # Let's use VerificationToken.
    
    expires_at = timezone.now() + timedelta(minutes=10)
    
    # Delete existing tokens for this user
    VerificationToken.objects.filter(user=user).delete()
    
    VerificationToken.objects.create(
        user=user,
        token=otp,
        expires_at=expires_at
    )
    
    # Send email
    send_mail(
        'Login OTP',
        f'Your OTP for login is: {otp}. It expires in 10 minutes.',
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )
    
    return Response({'message': 'OTP sent successfully'})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_login_otp(request):
    """Verify OTP and login"""
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    if not email or not otp:
        return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    try:
        token = VerificationToken.objects.get(
            user=user,
            token=otp,
            expires_at__gt=timezone.now()
        )
        token.delete() # Consume token
        
        # Login successful
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
            'message': 'Login successful'
        })
        
    except VerificationToken.DoesNotExist:
        return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_email(request, token):
    """Verify email with token"""
    try:
        verification_token = VerificationToken.objects.get(
            token=token,
            expires_at__gt=timezone.now()
        )
        user = verification_token.user
        user.is_verified = True
        user.save()
        verification_token.delete()
        
        return Response({'message': 'Email verified successfully'})
    except VerificationToken.DoesNotExist:
        return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resend_verification_email(request):
    """Resend verification email"""
    user = request.user
    if user.is_verified:
        return Response({'message': 'Email already verified'}, status=status.HTTP_400_BAD_REQUEST)
        
    token = str(uuid.uuid4())
    expires_at = timezone.now() + timedelta(hours=24)
    
    # Delete old tokens
    VerificationToken.objects.filter(user=user).delete()
    
    VerificationToken.objects.create(
        user=user,
        token=token,
        expires_at=expires_at
    )
    
    send_verification_email(user, token)
    return Response({'message': 'Verification email sent'})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def request_password_reset(request):
    serializer = PasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Password reset link sent to your email'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def confirm_password_reset(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Password has been reset successfully'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile

class UserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        if self.request.user.user_type != 'admin' and not self.request.user.is_staff:
             return User.objects.none()
        return User.objects.all()

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = 'id'

    def get_queryset(self):
        if self.request.user.user_type != 'admin' and not self.request.user.is_staff:
             return User.objects.none()
        return User.objects.all()

class TutorListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        return User.objects.filter(user_type='tutor', is_approved=True)

class StudentListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        # Tutors can see students
        if self.request.user.user_type == 'tutor':
             return User.objects.filter(user_type='student')
        # Students can see other students? Maybe not for privacy.
        # But for group chat, maybe yes? Let's allow it for now.
        return User.objects.filter(user_type='student')

class StudentDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'student':
            return Response({'error': 'Only students can access student dashboard'}, status=status.HTTP_403_FORBIDDEN)
        
        user = request.user
        
        # Lazy imports to avoid circular dependencies
        from courses.models import Enrollment
        from quizzes.models import QuizAttempt
        from interviews.models import InterviewBooking
        from chat.models import Message
        
        # Stats
        enrolled_courses = Enrollment.objects.filter(student=user, is_active=True).count()
        completed_quizzes = QuizAttempt.objects.filter(student=user, is_completed=True).count()
        
        # Upcoming interviews (today or future)
        today = timezone.now().date()
        upcoming_interviews = InterviewBooking.objects.filter(
            student=user, 
            slot__date__gte=today,
            is_confirmed=True
        ).count()
        
        # Unread messages
        unread_messages = Message.objects.filter(
            room__participants=user,
            is_read=False
        ).exclude(sender=user).count()
        
        data = {
            'stats': [
                {'title': 'Enrolled Courses', 'value': str(enrolled_courses), 'icon': 'FiBook', 'color': 'bg-blue-500'},
                {'title': 'Completed Quizzes', 'value': str(completed_quizzes), 'icon': 'FiCheckSquare', 'color': 'bg-green-500'},
                {'title': 'Upcoming Interviews', 'value': str(upcoming_interviews), 'icon': 'FiCalendar', 'color': 'bg-purple-500'},
                {'title': 'Unread Messages', 'value': str(unread_messages), 'icon': 'FiMessageSquare', 'color': 'bg-yellow-500'},
            ]
        }
        
        return Response(data)
