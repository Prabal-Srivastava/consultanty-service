from django.contrib import admin
from .models import MockInterview, InterviewQuestion, InterviewStudentAnswer, InterviewSlot, InterviewBooking

@admin.register(MockInterview)
class MockInterviewAdmin(admin.ModelAdmin):
    list_display = ('title', 'student', 'course', 'interviewer', 'interview_type', 'scheduled_at', 'status', 'rating')
    list_filter = ('interview_type', 'status', 'scheduled_at', 'course__subject')
    search_fields = ('title', 'student__username', 'interviewer__username')
    ordering = ('-scheduled_at',)

@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ('mock_interview', 'question_text', 'marks', 'order')
    list_filter = ('mock_interview__interview_type',)
    search_fields = ('question_text', 'mock_interview__title')
    ordering = ('mock_interview', 'order')

@admin.register(InterviewStudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ('student', 'question', 'marks_obtained', 'answered_at')
    list_filter = ('question__mock_interview__interview_type',)
    search_fields = ('student__username', 'question__question_text')
    ordering = ('-answered_at',)

@admin.register(InterviewSlot)
class InterviewSlotAdmin(admin.ModelAdmin):
    list_display = ('interviewer', 'date', 'start_time', 'end_time', 'status')
    list_filter = ('status', 'date')
    search_fields = ('interviewer__username',)
    ordering = ('date', 'start_time')

@admin.register(InterviewBooking)
class InterviewBookingAdmin(admin.ModelAdmin):
    list_display = ('student', 'slot', 'course', 'booking_date', 'is_confirmed')
    list_filter = ('is_confirmed', 'booking_date')
    search_fields = ('student__username', 'slot__interviewer__username')
    ordering = ('-booking_date',)
