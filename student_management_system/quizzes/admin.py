from django.contrib import admin
from .models import Quiz, Question, Choice, QuizStudentAnswer, QuizAttempt

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'total_marks', 'duration', 'is_active', 'created_at')
    list_filter = ('is_active', 'course__subject', 'created_at')
    search_fields = ('title', 'description', 'course__title')
    ordering = ('-created_at',)

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'quiz', 'question_type', 'marks', 'order')
    list_filter = ('question_type', 'quiz__course__subject')
    search_fields = ('text', 'quiz__title')
    ordering = ('quiz', 'order')

@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ('text', 'question', 'is_correct', 'order')
    list_filter = ('is_correct', 'question__quiz__course')
    search_fields = ('text',)
    ordering = ('question', 'order')

@admin.register(QuizStudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ('student', 'question', 'is_correct', 'marks_obtained', 'answered_at')
    list_filter = ('is_correct', 'question__quiz__course')
    search_fields = ('student__username', 'question__text')
    ordering = ('-answered_at',)

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('student', 'quiz', 'total_marks', 'obtained_marks', 'percentage', 'is_completed', 'start_time')
    list_filter = ('is_completed', 'quiz__course__subject')
    search_fields = ('student__username', 'quiz__title')
    ordering = ('-start_time',)
