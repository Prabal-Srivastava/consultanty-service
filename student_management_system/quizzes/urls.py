from django.urls import path
from . import views

urlpatterns = [
    # Quiz URLs
    path('', views.QuizListCreateView.as_view(), name='quiz-root'), # Handle /api/quizzes/
    path('<int:pk>/', views.QuizDetailView.as_view(), name='quiz-detail-root'), # Handle /api/quizzes/1/
    path('quizzes/', views.QuizListCreateView.as_view(), name='quiz-list-create'),
    path('quizzes/<int:pk>/', views.QuizDetailView.as_view(), name='quiz-detail'),
    path('<int:quiz_id>/start/', views.start_quiz, name='start-quiz-root'), # Handle /api/quizzes/1/start/
    path('quizzes/<int:quiz_id>/start/', views.start_quiz, name='start-quiz'),
    path('<int:quiz_id>/results/', views.quiz_results, name='quiz-results-root'), # Handle /api/quizzes/1/results/
    path('quizzes/<int:quiz_id>/results/', views.quiz_results, name='quiz-results'),
    
    # Question URLs
    path('quizzes/<int:quiz_id>/questions/', views.QuestionListCreateView.as_view(), name='question-list-create'),
    
    # Quiz Attempt URLs
    path('attempts/', views.QuizAttemptListView.as_view(), name='quiz-attempt-list'),
    path('attempts/<int:pk>/', views.QuizAttemptDetailView.as_view(), name='quiz-attempt-detail'),
    path('attempts/<int:attempt_id>/submit/', views.submit_answer, name='submit-answer'),
    path('attempts/<int:attempt_id>/complete/', views.complete_quiz, name='complete-quiz'),
    
    # Student Answer URLs
    path('answers/', views.StudentAnswerCreateView.as_view(), name='student-answer-create'),
]