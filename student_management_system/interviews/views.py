from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta
from .models import MockInterview, InterviewQuestion, InterviewStudentAnswer, InterviewSlot, InterviewBooking
from courses.models import Course, Enrollment
from .serializers import MockInterviewSerializer, StudentAnswerSerializer, InterviewSlotSerializer, InterviewBookingSerializer, AvailableSlotSerializer
from notifications.utils import send_notification

class MockInterviewListCreateView(generics.ListCreateAPIView):
    serializer_class = MockInterviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'student':
            return MockInterview.objects.filter(student=user)
        elif user.user_type == 'tutor':
            return MockInterview.objects.filter(interviewer=user)
        return MockInterview.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.user_type == 'tutor':
            # Tutor creating interview for student
            serializer.save(interviewer=user)
        elif user.user_type == 'student':
            # Student requesting interview (needs tutor assignment)
            serializer.save(student=user, status='scheduled')

class MockInterviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MockInterviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'student':
            return MockInterview.objects.filter(student=user)
        elif user.user_type == 'tutor':
            return MockInterview.objects.filter(interviewer=user)
        return MockInterview.objects.none()

class StudentAnswerCreateView(generics.CreateAPIView):
    serializer_class = StudentAnswerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        if self.request.user.user_type != 'student':
            raise permissions.PermissionDenied("Only students can submit answers.")
        serializer.save(student=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_interview(request, interview_id):
    """Start a mock interview"""
    if request.user.user_type != 'tutor':
        return Response({
            'error': 'Only tutors can start interviews'
        }, status=status.HTTP_403_FORBIDDEN)
    
    interview = get_object_or_404(MockInterview, id=interview_id, interviewer=request.user)
    
    if interview.status != 'scheduled':
        return Response({
            'error': 'Interview is not scheduled'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    interview.status = 'ongoing'
    interview.save()
    
    serializer = MockInterviewSerializer(interview)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_interview(request, interview_id):
    """Complete a mock interview"""
    if request.user.user_type != 'tutor':
        return Response({
            'error': 'Only tutors can complete interviews'
        }, status=status.HTTP_403_FORBIDDEN)
    
    interview = get_object_or_404(MockInterview, id=interview_id, interviewer=request.user)
    
    if interview.status != 'ongoing':
        return Response({
            'error': 'Interview is not ongoing'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Calculate total marks
    answers = StudentAnswer.objects.filter(question__mock_interview=interview)
    total_marks = sum(answer.marks_obtained for answer in answers)
    max_marks = sum(question.marks for question in interview.questions.all())
    
    if max_marks > 0:
        interview.rating = int((total_marks / max_marks) * 10)
    
    interview.status = 'completed'
    interview.save()
    
    serializer = MockInterviewSerializer(interview)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_available_slots(request):
    """Get available interview slots"""
    date_str = request.query_params.get('date')
    interviewer_id = request.query_params.get('interviewer')
    
    queryset = InterviewSlot.objects.filter(status='available')
    
    if date_str:
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            queryset = queryset.filter(date=date)
        except ValueError:
            pass
    
    if interviewer_id:
        queryset = queryset.filter(interviewer_id=interviewer_id)
    
    # Only show future slots
    today = timezone.now().date()
    queryset = queryset.filter(date__gte=today)
    
    serializer = AvailableSlotSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def book_interview_slot(request):
    """Book an interview slot"""
    if request.user.user_type != 'student':
        return Response({
            'error': 'Only students can book interview slots'
        }, status=status.HTTP_403_FORBIDDEN)
    
    slot_id = request.data.get('slot_id')
    course_id = request.data.get('course_id')
    
    if not slot_id or not course_id:
        return Response({
            'error': 'Slot ID and Course ID are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    slot = get_object_or_404(InterviewSlot, id=slot_id, status='available')
    course = get_object_or_404(Course, id=course_id)
    
    # Check if student is enrolled in the course
    if not Enrollment.objects.filter(student=request.user, course=course, is_active=True).exists():
        return Response({
            'error': 'You must be enrolled in the course to book an interview'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Check if slot is in the future
    slot_datetime = timezone.make_aware(datetime.combine(slot.date, slot.start_time))
    if slot_datetime < timezone.now():
        return Response({
            'error': 'Cannot book past slots'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Book the slot
    slot.status = 'booked'
    slot.save()
    
    booking = InterviewBooking.objects.create(
        student=request.user,
        slot=slot,
        course=course
    )
    
    # Send notification to tutor
    send_notification(
        recipient=slot.interviewer,
        title='New Interview Booking',
        message=f'{request.user.first_name} {request.user.last_name} has booked an interview slot on {slot.date} at {slot.start_time}',
        notification_type='interview',
        sender=request.user,
        link=f'/interviews/bookings/{booking.id}'
    )
    
    serializer = InterviewBookingSerializer(booking)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_interview_bookings(request):
    """Get current user's interview bookings"""
    if request.user.user_type != 'student':
        return Response({
            'error': 'Only students have interview bookings'
        }, status=status.HTTP_403_FORBIDDEN)
    
    bookings = InterviewBooking.objects.filter(student=request.user)
    serializer = InterviewBookingSerializer(bookings, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def tutor_interview_slots(request):
    """Get interview slots for tutor"""
    if request.user.user_type != 'tutor':
        return Response({
            'error': 'Only tutors have interview slots'
        }, status=status.HTTP_403_FORBIDDEN)
    
    slots = InterviewSlot.objects.filter(interviewer=request.user)
    serializer = InterviewSlotSerializer(slots, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_interview_slots(request):
    """Create interview slots (tutor only)"""
    if request.user.user_type != 'tutor':
        return Response({
            'error': 'Only tutors can create interview slots'
        }, status=status.HTTP_403_FORBIDDEN)
    
    date_str = request.data.get('date')
    start_time_str = request.data.get('start_time')
    end_time_str = request.data.get('end_time')
    duration = request.data.get('duration', 60)  # Default 60 minutes
    
    if not all([date_str, start_time_str, end_time_str]):
        return Response({
            'error': 'Date, start time, and end time are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        start_time = datetime.strptime(start_time_str, '%H:%M').time()
        end_time = datetime.strptime(end_time_str, '%H:%M').time()
    except ValueError:
        return Response({
            'error': 'Invalid date or time format'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create slots in intervals
    current_time = datetime.combine(date, start_time)
    end_datetime = datetime.combine(date, end_time)
    
    created_slots = []
    while current_time + timedelta(minutes=duration) <= end_datetime:
        slot = InterviewSlot.objects.create(
            interviewer=request.user,
            date=date,
            start_time=current_time.time(),
            end_time=(current_time + timedelta(minutes=duration)).time()
        )
        created_slots.append(slot)
        current_time += timedelta(minutes=duration)
    
    serializer = InterviewSlotSerializer(created_slots, many=True)
    return Response(serializer.data, status=status.HTTP_201_CREATED)