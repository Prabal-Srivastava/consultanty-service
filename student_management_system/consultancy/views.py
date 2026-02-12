from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.core.mail import send_mail
from django.conf import settings
from .models import (
    ConsultancyService, Organization, ConsultancyContract, 
    StudentEnrollment, ConsultancyReport, ConsultancySession,
    SuccessStory, FAQ
)
from .serializers import (
    ConsultancyServiceSerializer, OrganizationSerializer, 
    ConsultancyContractSerializer, StudentEnrollmentSerializer, 
    ConsultancyReportSerializer, ConsultancySessionSerializer,
    SuccessStorySerializer, FAQSerializer
)
from django.db.models import Q, Sum
from datetime import date, timedelta
from django.contrib.auth import get_user_model

User = get_user_model()

class SuccessStoryViewSet(viewsets.ReadOnlyModelViewSet):
    """View success stories (Public)"""
    queryset = SuccessStory.objects.filter(is_active=True)
    serializer_class = SuccessStorySerializer
    permission_classes = []

class FAQViewSet(viewsets.ReadOnlyModelViewSet):
    """View FAQs (Public)"""
    queryset = FAQ.objects.filter(is_active=True)
    serializer_class = FAQSerializer
    permission_classes = []

class ConsultancySessionViewSet(viewsets.ModelViewSet):
    """Manage consultancy sessions"""
    queryset = ConsultancySession.objects.all()
    serializer_class = ConsultancySessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff: # Admin
            return ConsultancySession.objects.all()
        elif user.user_type == 'tutor':
            return ConsultancySession.objects.filter(consultant=user)
        else:
            return ConsultancySession.objects.filter(student=user)
            
    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

class ConsultancyServiceViewSet(viewsets.ModelViewSet):
    """Manage consultancy services"""
    queryset = ConsultancyService.objects.filter(is_active=True)
    serializer_class = ConsultancyServiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            return ConsultancyService.objects.all()
        return ConsultancyService.objects.filter(is_active=True)

class OrganizationViewSet(viewsets.ModelViewSet):
    """Manage organizations"""
    queryset = Organization.objects.filter(is_active=True)
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

class ConsultancyContractViewSet(viewsets.ModelViewSet):
    """Manage consultancy contracts"""
    queryset = ConsultancyContract.objects.all()
    serializer_class = ConsultancyContractSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'generate_report']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            return ConsultancyContract.objects.all()
        elif user.user_type == 'tutor':
            return ConsultancyContract.objects.filter(admin_user=user)
        else:
            # For students, only contracts they're enrolled in
            return ConsultancyContract.objects.filter(
                student_enrollments__student=user
            ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(admin_user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def enroll_student(self, request, pk=None):
        """Enroll a student in the contract"""
        contract = self.get_object()
        student_id = request.data.get('student_id')
        
        if not student_id:
            return Response(
                {'error': 'Student ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student = User.objects.get(id=student_id, user_type='student')
        except User.DoesNotExist:
            return Response(
                {'error': 'Student not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if student is already enrolled
        if StudentEnrollment.objects.filter(
            contract=contract, student=student
        ).exists():
            return Response(
                {'error': 'Student already enrolled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check student limit
        current_count = contract.student_enrollments.filter(is_active=True).count()
        if current_count >= contract.service.students_limit:
            return Response(
                {'error': 'Student limit reached for this contract'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        enrollment = StudentEnrollment.objects.create(
            contract=contract,
            student=student
        )
        
        return Response(
            StudentEnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def generate_report(self, request, pk=None):
        """Generate performance report for the contract"""
        contract = self.get_object()
        report_date = date.today()
        
        # Get analytics data
        total_students = contract.student_enrollments.count()
        active_students = contract.student_enrollments.filter(is_active=True).count()
        
        # Calculate placement rate (students with job offers)
        completed_students = User.objects.filter(
            consultancy_enrollments__contract=contract,
            user_type='student'
        ).count()
        
        # Calculate average quiz scores
        from quizzes.models import QuizAttempt
        quiz_attempts = QuizAttempt.objects.filter(
            student__consultancy_enrollments__contract=contract
        )
        avg_quiz_score = 0
        if quiz_attempts.exists():
            avg_quiz_score = quiz_attempts.aggregate(
                avg_score=Sum('obtained_marks') / Sum('total_marks') * 100
            )['avg_score'] or 0
        
        # Calculate interview completion rate
        from interviews.models import InterviewSession
        total_interviews = InterviewSession.objects.filter(
            student__consultancy_enrollments__contract=contract
        ).count()
        completed_interviews = InterviewSession.objects.filter(
            student__consultancy_enrollments__contract=contract,
            status='COMPLETED'
        ).count()
        
        interview_rate = 0
        if total_interviews > 0:
            interview_rate = (completed_interviews / total_interviews) * 100
        
        # Calculate revenue (this would typically come from payment system)
        revenue = contract.amount_paid
        
        report_data = {
            'contract': contract.id,
            'report_date': report_date,
            'total_students': total_students,
            'active_students': active_students,
            'completed_students': completed_students,
            'placement_rate': round((completed_students / total_students * 100) if total_students > 0 else 0, 2),
            'average_quiz_score': round(avg_quiz_score, 2),
            'interview_completion_rate': round(interview_rate, 2),
            'revenue_generated': revenue
        }
        
        serializer = ConsultancyReportSerializer(data=report_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StudentEnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    """View student enrollments"""
    queryset = StudentEnrollment.objects.all()
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            return StudentEnrollment.objects.all()
        elif user.user_type == 'tutor':
            return StudentEnrollment.objects.filter(
                contract__admin_user=user
            )
        else:
            return StudentEnrollment.objects.filter(student=user)

class ConsultancyReportViewSet(viewsets.ReadOnlyModelViewSet):
    """View consultancy reports"""
    queryset = ConsultancyReport.objects.all()
    serializer_class = ConsultancyReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            return ConsultancyReport.objects.all()
        elif user.user_type == 'tutor':
            return ConsultancyReport.objects.filter(
                contract__admin_user=user
            )
        else:
            # Students can see reports for contracts they're enrolled in
            return ConsultancyReport.objects.filter(
                contract__student_enrollments__student=user
            ).distinct()


@api_view(['POST'])
@permission_classes([])
def contact_us(request):
    """
    Handle contact form submissions
    """
    name = request.data.get('name')
    email = request.data.get('email')
    subject = request.data.get('subject')
    message = request.data.get('message')
    
    if not all([name, email, subject, message]):
        return Response(
            {'error': 'All fields are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate email format
    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError
    
    try:
        validate_email(email)
    except ValidationError:
        return Response(
            {'error': 'Invalid email format'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Prepare email content
    email_subject = f"[Contact Form] {subject}"
    email_message = f"""
    New contact form submission:
    
    Name: {name}
    Email: {email}
    Subject: {subject}
    
    Message:
    {message}
    
    Sent from: {settings.DEFAULT_FROM_EMAIL}
    """
    
    try:
        # Send email to admin/support
        # Use a fallback email if settings.EMAIL_HOST_USER is not configured
        admin_email = getattr(settings, 'CONTACT_RECIPIENT_EMAIL', 
                             getattr(settings, 'EMAIL_HOST_USER', 'admin@edusystem.com'))
        
        send_mail(
            subject=email_subject,
            message=email_message,
            from_email=email,  # Use sender's email as from_email
            recipient_list=[admin_email],  # Send to admin
            fail_silently=False,
        )
        
        return Response(
            {'message': 'Thank you for contacting us. We will get back to you soon.'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        print(f"Failed to send contact email: {str(e)}")  # Log error for debugging
        # Return a more user-friendly error message
        return Response(
            {'error': 'Failed to send message. Our team has been notified. Please try again later or contact us directly.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )