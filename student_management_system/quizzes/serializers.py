from rest_framework import serializers
from .models import Quiz, Question, Choice, QuizStudentAnswer, QuizAttempt
from accounts.serializers import UserSerializer

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'text', 'is_correct', 'order')
        read_only_fields = ('id',)

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    choices_data = serializers.ListField(
        child=serializers.DictField(), 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = Question
        fields = ('id', 'text', 'question_type', 'marks', 'order', 'choices', 'choices_data')
        read_only_fields = ('id',)

    def create(self, validated_data):
        choices_data = validated_data.pop('choices_data', [])
        question = Question.objects.create(**validated_data)
        
        # Create choices if provided
        for choice_data in choices_data:
            Choice.objects.create(question=question, **choice_data)
        
        return question

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    questions_data = serializers.ListField(
        child=serializers.DictField(), 
        write_only=True, 
        required=False
    )
    course_title = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = Quiz
        fields = ('id', 'course', 'title', 'description', 'total_marks', 'duration', 
                 'is_active', 'created_at', 'questions', 'questions_data', 'course_title')
        read_only_fields = ('id', 'created_at', 'total_marks')

    def create(self, validated_data):
        questions_data = validated_data.pop('questions_data', [])
        quiz = Quiz.objects.create(**validated_data)
        
        total_marks = 0
        # Create questions if provided
        for question_data in questions_data:
            choices_data = question_data.pop('choices_data', [])
            question = Question.objects.create(quiz=quiz, **question_data)
            total_marks += question.marks
            
            # Create choices for each question
            for choice_data in choices_data:
                Choice.objects.create(question=question, **choice_data)
        
        quiz.total_marks = total_marks
        quiz.save()
        
        return quiz

class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizStudentAnswer
        fields = ('id', 'question', 'choice', 'short_answer', 'is_correct', 'marks_obtained')
        read_only_fields = ('id', 'is_correct', 'marks_obtained')

class QuizAttemptSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    quiz = QuizSerializer(read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = ('id', 'student', 'quiz', 'start_time', 'end_time', 'total_marks', 
                 'obtained_marks', 'percentage', 'is_completed')
        read_only_fields = ('id', 'student', 'start_time', 'total_marks', 'obtained_marks', 'percentage')

class QuizAttemptDetailSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    quiz = QuizSerializer(read_only=True)
    answers = StudentAnswerSerializer(many=True, read_only=True, source='quizstudentanswer_set')
    
    class Meta:
        model = QuizAttempt
        fields = ('id', 'student', 'quiz', 'start_time', 'end_time', 'total_marks', 
                 'obtained_marks', 'percentage', 'is_completed', 'answers')
        read_only_fields = ('id', 'student', 'start_time', 'total_marks', 'obtained_marks', 'percentage')