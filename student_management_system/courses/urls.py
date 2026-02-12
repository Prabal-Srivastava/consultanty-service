from django.urls import path
from . import views

urlpatterns = [
    # Subject URLs
    path('subjects/', views.SubjectListCreateView.as_view(), name='subject-list-create'),
    path('subjects/<int:pk>/', views.SubjectDetailView.as_view(), name='subject-detail'),
    
    # Course URLs
    path('courses/', views.CourseListCreateView.as_view(), name='course-list-create'),
    path('courses/<int:pk>/', views.CourseDetailView.as_view(), name='course-detail'),
    path('courses/<int:course_id>/enroll/', views.enroll_in_course, name='enroll-in-course'),
    
    # Enrollment URLs
    path('enrollments/', views.EnrollmentCreateView.as_view(), name='enrollment-create'),
    path('my-enrollments/', views.StudentEnrollmentsView.as_view(), name='student-enrollments'),
    path('my-courses/', views.TutorCoursesView.as_view(), name='tutor-courses'),
    path('enrollments/<int:enrollment_id>/progress/', views.update_progress, name='update-progress'),
]