from django.db import models
from django.conf import settings
from courses.models import Course

class MockInterview(models.Model):
    INTERVIEW_TYPES = (
        ('technical', 'Technical'),
        ('hr', 'HR'),
        ('behavioral', 'Behavioral'),
        ('coding', 'Coding'),
    )
    
    INTERVIEW_STATUS = (
        ('scheduled', 'Scheduled'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'user_type': 'student'}, related_name='mock_interviews')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='mock_interviews')
    interviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'user_type': 'tutor'}, related_name='conducted_interviews')
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    scheduled_at = models.DateTimeField()
    duration = models.IntegerField(help_text="Duration in minutes", default=60)
    status = models.CharField(max_length=20, choices=INTERVIEW_STATUS, default='scheduled')
    feedback = models.TextField(blank=True)
    rating = models.IntegerField(null=True, blank=True, help_text="Rating out of 10")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} - {self.student.username}"
    
    class Meta:
        ordering = ['-scheduled_at']

class InterviewQuestion(models.Model):
    mock_interview = models.ForeignKey(MockInterview, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    expected_answer = models.TextField(blank=True)
    marks = models.IntegerField(default=10)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Q{self.order + 1}: {self.question_text[:50]}..."
    
    class Meta:
        ordering = ['order']

class InterviewStudentAnswer(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'user_type': 'student'}, related_name='interview_answers')
    question = models.ForeignKey(InterviewQuestion, on_delete=models.CASCADE)
    answer_text = models.TextField()
    marks_obtained = models.IntegerField(default=0)
    feedback = models.TextField(blank=True)
    answered_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.student.username} - {self.question.question_text[:30]}..."
    
    class Meta:
        unique_together = ['student', 'question']
        ordering = ['-answered_at']

class InterviewSlot(models.Model):
    SLOT_STATUS = (
        ('available', 'Available'),
        ('booked', 'Booked'),
        ('completed', 'Completed'),
    )
    
    interviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'user_type': 'tutor'}, related_name='interview_slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=SLOT_STATUS, default='available')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.interviewer.username} - {self.date} {self.start_time}-{self.end_time}"
    
    class Meta:
        ordering = ['date', 'start_time']

class InterviewBooking(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'user_type': 'student'}, related_name='interview_bookings')
    slot = models.OneToOneField(InterviewSlot, on_delete=models.CASCADE, related_name='booking')
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    booking_date = models.DateTimeField(auto_now_add=True)
    is_confirmed = models.BooleanField(default=False)
    confirmation_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.student.username} - {self.slot}"
    
    class Meta:
        ordering = ['-booking_date']