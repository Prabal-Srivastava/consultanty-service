
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'student_management.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from quizzes.views import start_quiz, submit_answer, complete_quiz, quiz_results
from quizzes.models import Quiz, QuizAttempt, Question, Choice
from accounts.models import User
from courses.models import Course, Subject, Enrollment

def verify_flow():
    factory = APIRequestFactory()
    
    # Setup data
    tutor, _ = User.objects.get_or_create(username='tutor_flow', user_type='tutor', email='tutor_flow@example.com')
    student, _ = User.objects.get_or_create(username='student_flow', user_type='student', email='student_flow@example.com')
    subject, _ = Subject.objects.get_or_create(name='Flow Subject')
    course, _ = Course.objects.get_or_create(title='Flow Course', subject=subject, tutor=tutor, duration=10, fee=100)
    
    # Enroll student
    Enrollment.objects.get_or_create(student=student, course=course, is_active=True)
    
    # Create Quiz
    quiz, _ = Quiz.objects.get_or_create(title='Flow Quiz', course=course, total_marks=10, duration=10, is_active=True)
    
    # Create Question
    question, _ = Question.objects.get_or_create(quiz=quiz, text='What is 2+2?', question_type='multiple_choice', marks=5)
    choice1, _ = Choice.objects.get_or_create(question=question, text='4', is_correct=True)
    choice2, _ = Choice.objects.get_or_create(question=question, text='5', is_correct=False)
    
    print(f"Testing Quiz Flow for Quiz ID: {quiz.id}")
    
    # 1. Start Quiz
    print("\n1. Starting Quiz...")
    request = factory.post(f'/api/quizzes/{quiz.id}/start/')
    force_authenticate(request, user=student)
    response = start_quiz(request, quiz_id=quiz.id)
    print(f"Start Quiz Response: {response.status_code}")
    if response.status_code not in [200, 201]:
        print(f"Error: {response.data}")
        return
        
    attempt_id = response.data['id']
    print(f"Attempt ID: {attempt_id}")
    
    # 2. Submit Answer
    print("\n2. Submitting Answer...")
    data = {
        'question_id': question.id,
        'choice_id': choice1.id
    }
    request = factory.post(f'/api/quizzes/attempts/{attempt_id}/submit/', data, format='json')
    force_authenticate(request, user=student)
    response = submit_answer(request, attempt_id=attempt_id)
    print(f"Submit Answer Response: {response.status_code}")
    print(f"Result: {response.data}")
    
    # 3. Complete Quiz
    print("\n3. Completing Quiz...")
    request = factory.post(f'/api/quizzes/attempts/{attempt_id}/complete/')
    force_authenticate(request, user=student)
    response = complete_quiz(request, attempt_id=attempt_id)
    print(f"Complete Quiz Response: {response.status_code}")
    print(f"Score: {response.data.get('obtained_marks')}/{response.data.get('total_marks')}")
    
    # 4. Get Results
    print("\n4. Getting Results...")
    request = factory.get(f'/api/quizzes/{quiz.id}/results/')
    force_authenticate(request, user=student)
    response = quiz_results(request, quiz_id=quiz.id)
    print(f"Get Results Response: {response.status_code}")
    print(f"Attempts count: {len(response.data)}")

if __name__ == '__main__':
    verify_flow()
