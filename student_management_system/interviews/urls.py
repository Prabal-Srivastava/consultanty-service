from django.urls import path
from . import views

urlpatterns = [
    # Mock Interview URLs
    path('mock-interviews/', views.MockInterviewListCreateView.as_view(), name='mock-interview-list-create'),
    path('mock-interviews/<int:pk>/', views.MockInterviewDetailView.as_view(), name='mock-interview-detail'),
    path('mock-interviews/<int:interview_id>/start/', views.start_interview, name='start-interview'),
    path('mock-interviews/<int:interview_id>/complete/', views.complete_interview, name='complete-interview'),
    
    # Student Answer URLs
    path('answers/', views.StudentAnswerCreateView.as_view(), name='student-answer-create'),
    
    # Interview Slot URLs
    path('slots/available/', views.get_available_slots, name='available-slots'),
    path('slots/book/', views.book_interview_slot, name='book-interview-slot'),
    path('slots/my-bookings/', views.my_interview_bookings, name='my-interview-bookings'),
    path('slots/tutor-slots/', views.tutor_interview_slots, name='tutor-interview-slots'),
    path('slots/create/', views.create_interview_slots, name='create-interview-slots'),
]