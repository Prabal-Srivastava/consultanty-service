from rest_framework import serializers
from .models import MockInterview, InterviewQuestion, InterviewStudentAnswer, InterviewSlot, InterviewBooking
from accounts.serializers import UserSerializer
from courses.serializers import CourseSerializer

class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = ('id', 'question_text', 'expected_answer', 'marks', 'order')
        read_only_fields = ('id',)

class MockInterviewSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    interviewer = UserSerializer(read_only=True)
    questions = InterviewQuestionSerializer(many=True, read_only=True)
    questions_data = serializers.ListField(
        child=serializers.DictField(), 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = MockInterview
        fields = ('id', 'student', 'course', 'interviewer', 'interview_type', 'title', 
                 'description', 'scheduled_at', 'duration', 'status', 'feedback', 'rating', 
                 'questions', 'questions_data', 'created_at')
        read_only_fields = ('id', 'student', 'status', 'created_at')

    def create(self, validated_data):
        questions_data = validated_data.pop('questions_data', [])
        mock_interview = MockInterview.objects.create(**validated_data)
        
        # Create questions if provided
        for question_data in questions_data:
            InterviewQuestion.objects.create(mock_interview=mock_interview, **question_data)
        
        return mock_interview

class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewStudentAnswer
        fields = ('id', 'question', 'answer_text', 'marks_obtained', 'feedback')
        read_only_fields = ('id', 'marks_obtained', 'feedback')

class InterviewSlotSerializer(serializers.ModelSerializer):
    interviewer = UserSerializer(read_only=True)
    is_booked = serializers.SerializerMethodField()
    
    class Meta:
        model = InterviewSlot
        fields = ('id', 'interviewer', 'date', 'start_time', 'end_time', 'status', 'is_booked', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_is_booked(self, obj):
        return hasattr(obj, 'booking')

class InterviewBookingSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    slot = InterviewSlotSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = InterviewBooking
        fields = ('id', 'student', 'slot', 'course', 'booking_date', 'is_confirmed', 'confirmation_date')
        read_only_fields = ('id', 'student', 'booking_date', 'is_confirmed', 'confirmation_date')

class AvailableSlotSerializer(serializers.ModelSerializer):
    interviewer = UserSerializer(read_only=True)
    
    class Meta:
        model = InterviewSlot
        fields = ('id', 'interviewer', 'date', 'start_time', 'end_time')