from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Quiz, Question, Choice, QuizStudentAnswer, QuizAttempt
from .serializers import QuizSerializer, QuestionSerializer, StudentAnswerSerializer, QuizAttemptSerializer, QuizAttemptDetailSerializer
from courses.models import Course, Enrollment
from notifications.utils import send_notification

class QuizListCreateView(generics.ListCreateAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        course_id = self.request.query_params.get('course')
        if course_id:
            return Quiz.objects.filter(course_id=course_id, is_active=True)
        return Quiz.objects.filter(is_active=True)
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        # Only tutors can create quizzes
        if self.request.user.user_type != 'tutor':
            raise permissions.PermissionDenied("Only tutors can create quizzes.")
        serializer.save()

class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    def check_object_permissions(self, request, obj):
        # Only the tutor who created the quiz can edit/delete it
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            if obj.course.tutor != request.user and not request.user.is_staff:
                self.permission_denied(request)

class QuestionListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        quiz_id = self.kwargs['quiz_id']
        return Question.objects.filter(quiz_id=quiz_id)
    
    def perform_create(self, serializer):
        quiz_id = self.kwargs['quiz_id']
        quiz = get_object_or_404(Quiz, id=quiz_id)
        
        # Only the tutor who created the quiz can add questions
        if quiz.course.tutor != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only the quiz creator can add questions.")
        
        serializer.save(quiz=quiz)

class StudentAnswerCreateView(generics.CreateAPIView):
    serializer_class = StudentAnswerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # Only students can submit answers
        if self.request.user.user_type != 'student':
            raise permissions.PermissionDenied("Only students can submit answers.")
        serializer.save(student=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_quiz(request, quiz_id):
    """Start a quiz attempt for a student"""
    if request.user.user_type != 'student':
        return Response({
            'error': 'Only students can take quizzes'
        }, status=status.HTTP_403_FORBIDDEN)
    
    quiz = get_object_or_404(Quiz, id=quiz_id, is_active=True)
    
    # Check if student is enrolled in the course
    if not Enrollment.objects.filter(student=request.user, course=quiz.course, is_active=True).exists():
        return Response({
            'error': 'You must be enrolled in the course to take this quiz'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Check if student already has an active attempt
    existing_attempt = QuizAttempt.objects.filter(
        student=request.user, 
        quiz=quiz, 
        is_completed=False
    ).first()
    
    if existing_attempt:
        serializer = QuizAttemptDetailSerializer(existing_attempt)
        return Response({
            'message': 'You already have an active quiz attempt',
            'attempt': serializer.data
        })
    
    # Create new quiz attempt
    attempt = QuizAttempt.objects.create(
        student=request.user,
        quiz=quiz,
        total_marks=quiz.total_marks
    )
    
    serializer = QuizAttemptDetailSerializer(attempt)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_answer(request, attempt_id):
    """Submit an answer for a specific question in a quiz attempt"""
    if request.user.user_type != 'student':
        return Response({
            'error': 'Only students can submit answers'
        }, status=status.HTTP_403_FORBIDDEN)
    
    attempt = get_object_or_404(QuizAttempt, id=attempt_id, student=request.user, is_completed=False)
    question_id = request.data.get('question_id')
    choice_id = request.data.get('choice_id')
    short_answer = request.data.get('short_answer', '')
    
    if not question_id:
        return Response({
            'error': 'Question ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    question = get_object_or_404(Question, id=question_id, quiz=attempt.quiz)
    
    # Check if answer already exists
    answer, created = QuizStudentAnswer.objects.get_or_create(
        student=request.user,
        question=question,
        defaults={
            'choice_id': choice_id,
            'short_answer': short_answer
        }
    )
    
    if not created:
        # Update existing answer
        answer.choice_id = choice_id
        answer.short_answer = short_answer
        answer.save()
    
    # Calculate if answer is correct
    if question.question_type == 'multiple_choice' and choice_id:
        choice = get_object_or_404(Choice, id=choice_id, question=question)
        answer.is_correct = choice.is_correct
        if choice.is_correct:
            answer.marks_obtained = question.marks
        else:
            answer.marks_obtained = 0
    elif question.question_type == 'true_false':
        # For true/false, we'll assume choice_id represents True/False
        answer.is_correct = bool(choice_id)
        if answer.is_correct:
            answer.marks_obtained = question.marks
        else:
            answer.marks_obtained = 0
    elif question.question_type == 'short_answer':
        # Short answer grading would typically be manual
        answer.is_correct = False
        answer.marks_obtained = 0
    
    answer.save()
    
    return Response({
        'message': 'Answer submitted successfully',
        'is_correct': answer.is_correct,
        'marks_obtained': answer.marks_obtained
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_quiz(request, attempt_id):
    """Complete a quiz attempt and calculate final score"""
    if request.user.user_type != 'student':
        return Response({
            'error': 'Only students can complete quizzes'
        }, status=status.HTTP_403_FORBIDDEN)
    
    attempt = get_object_or_404(QuizAttempt, id=attempt_id, student=request.user, is_completed=False)
    
    # Calculate total obtained marks
    answers = QuizStudentAnswer.objects.filter(
        student=request.user,
        question__quiz=attempt.quiz
    )
    
    obtained_marks = sum(answer.marks_obtained for answer in answers)
    attempt.obtained_marks = obtained_marks
    attempt.end_time = timezone.now()
    attempt.is_completed = True
    attempt.save()
    
    # Send notification to student
    send_notification(
        recipient=request.user,
        title='Quiz Completed',
        message=f'You have completed the quiz "{attempt.quiz.title}". Score: {obtained_marks}/{attempt.quiz.total_marks}',
        notification_type='quiz',
        link=f'/quizzes/attempts/{attempt.id}/results'
    )
    
    serializer = QuizAttemptDetailSerializer(attempt)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def quiz_results(request, quiz_id):
    """Get quiz results for the current student"""
    if request.user.user_type != 'student':
        return Response({
            'error': 'Only students can view quiz results'
        }, status=status.HTTP_403_FORBIDDEN)
    
    quiz = get_object_or_404(Quiz, id=quiz_id)
    attempts = QuizAttempt.objects.filter(student=request.user, quiz=quiz)
    
    serializer = QuizAttemptDetailSerializer(attempts, many=True)
    return Response(serializer.data)

class QuizAttemptListView(generics.ListAPIView):
    serializer_class = QuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return QuizAttempt.objects.filter(student=self.request.user).select_related('quiz', 'quiz__course')

class QuizAttemptDetailView(generics.RetrieveAPIView):
    serializer_class = QuizAttemptDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return QuizAttempt.objects.filter(student=self.request.user).select_related('quiz', 'quiz__course')