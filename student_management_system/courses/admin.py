from django.contrib import admin
from .models import Subject, Course, Enrollment, CourseMaterial

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'tutor', 'fee', 'duration', 'is_active')
    list_filter = ('subject', 'tutor', 'is_active', 'created_at')
    search_fields = ('title', 'description', 'tutor__username')
    ordering = ('-created_at',)

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'enrollment_date', 'is_active', 'progress')
    list_filter = ('is_active', 'enrollment_date', 'course__subject')
    search_fields = ('student__username', 'course__title')
    ordering = ('-enrollment_date',)

@admin.register(CourseMaterial)
class CourseMaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'is_published', 'created_at')
    list_filter = ('is_published', 'course__subject', 'created_at')
    search_fields = ('title', 'description', 'course__title')
    ordering = ('course', 'order')
