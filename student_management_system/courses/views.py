from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Subject, Course, Enrollment, CourseMaterial
from .serializers import SubjectSerializer, CourseSerializer, EnrollmentSerializer, EnrollmentListSerializer
from accounts.models import User

class SubjectListCreateView(generics.ListCreateAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAdminUser()]

class CourseListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Course.objects.filter(is_active=True, tutor__is_approved=True)
        subject = self.request.query_params.get('subject')
        tutor = self.request.query_params.get('tutor')
        
        if subject:
            queryset = queryset.filter(subject_id=subject)
        if tutor:
            queryset = queryset.filter(tutor_id=tutor)
            
        return queryset
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        # Only tutors can create courses
        if self.request.user.user_type != 'tutor':
            raise permissions.PermissionDenied("Only tutors can create courses.")
        if not self.request.user.is_approved:
            raise permissions.PermissionDenied("You must be approved by admin to create courses.")
        serializer.save()

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    def check_object_permissions(self, request, obj):
        # Only the tutor who created the course can edit/delete it
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            if obj.tutor != request.user and not request.user.is_staff:
                self.permission_denied(request)

class EnrollmentCreateView(generics.CreateAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # Only students can enroll in courses
        if self.request.user.user_type != 'student':
            raise permissions.PermissionDenied("Only students can enroll in courses.")
        serializer.save()

class StudentEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Enrollment.objects.filter(student=self.request.user, is_active=True)

class TutorCoursesView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only tutors can see their own courses
        if self.request.user.user_type != 'tutor':
            return Course.objects.none()
        return Course.objects.filter(tutor=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def enroll_in_course(request, course_id):
    """Enroll student in a course"""
    if request.user.user_type != 'student':
        return Response({
            'error': 'Only students can enroll in courses'
        }, status=status.HTTP_403_FORBIDDEN)
    
    course = get_object_or_404(Course, id=course_id, is_active=True)
    
    # Check if already enrolled
    if Enrollment.objects.filter(student=request.user, course=course, is_active=True).exists():
        return Response({
            'error': 'You are already enrolled in this course'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    enrollment = Enrollment.objects.create(
        student=request.user,
        course=course
    )
    
    serializer = EnrollmentSerializer(enrollment)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_progress(request, enrollment_id):
    """Update student progress in a course"""
    enrollment = get_object_or_404(Enrollment, id=enrollment_id, student=request.user)
    
    progress = request.data.get('progress')
    if progress is None:
        return Response({
            'error': 'Progress is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        progress = int(progress)
        if progress < 0 or progress > 100:
            raise ValueError
    except ValueError:
        return Response({
            'error': 'Progress must be an integer between 0 and 100'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    enrollment.progress = progress
    enrollment.save()
    
    return Response({
        'message': 'Progress updated successfully',
        'progress': enrollment.progress
    })