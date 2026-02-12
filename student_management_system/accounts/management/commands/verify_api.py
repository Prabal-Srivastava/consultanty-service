
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from courses.models import Course, Enrollment
from quizzes.models import Quiz, QuizAttempt
from interviews.models import InterviewSlot
from chat.models import Room
from django.utils import timezone
from datetime import timedelta
import json
import uuid

User = get_user_model()

class Command(BaseCommand):
    help = 'Verifies API endpoints for all roles'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting API verification...')
        client = APIClient()

        # Helper to print results
        def check_endpoint(method, url, user, data=None, expected_status=[200, 201]):
            client.force_authenticate(user=user)
            if method == 'GET':
                response = client.get(url)
            elif method == 'POST':
                response = client.post(url, data, format='json')
            
            status_code = response.status_code
            if isinstance(expected_status, int):
                expected_status = [expected_status]
            
            if status_code in expected_status:
                self.stdout.write(self.style.SUCCESS(f'[PASS] {method} {url} ({user.username})'))
                return response
            else:
                self.stdout.write(self.style.ERROR(f'[FAIL] {method} {url} ({user.username}) - Got {status_code}, Expected {expected_status}'))
                if status_code != 404: 
                    try:
                        self.stdout.write(f'Response: {response.json()}')
                    except:
                        self.stdout.write(f'Response: {response.content[:200]}')
                else:
                     try:
                        self.stdout.write(f'Response: {response.json()}')
                     except:
                        pass
                return response

        # 1. Admin Tests
        try:
            admin = User.objects.get(username='admin')
            self.stdout.write('\n--- Testing Admin Endpoints ---')
            check_endpoint('GET', '/api/auth/users/', admin)
            check_endpoint('GET', '/api/auth/tutors/', admin)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR("Admin user not found"))

        # 2. Tutor Tests
        try:
            tutor = User.objects.get(username='tutor1')
            self.stdout.write('\n--- Testing Tutor Endpoints ---')
            check_endpoint('GET', '/api/auth/profile/', tutor)
            check_endpoint('GET', '/api/courses/my-courses/', tutor)
            check_endpoint('GET', '/api/interviews/slots/tutor-slots/', tutor)
            
            # Create Quiz via API
            self.stdout.write('\n--- Testing Quiz Creation (Tutor) ---')
            tutor_course = Course.objects.filter(tutor=tutor).first()
            if tutor_course:
                quiz_payload = {
                    'course': tutor_course.id,
                    'title': 'API Test Quiz',
                    'description': 'Quiz created via verification script',
                    'duration': 30,
                    'questions_data': [
                        {
                            'text': 'What is 2 + 2?',
                            'question_type': 'multiple_choice',
                            'marks': 5,
                            'order': 0,
                            'choices_data': [
                                {'text': '3', 'is_correct': False, 'order': 0},
                                {'text': '4', 'is_correct': True, 'order': 1}
                            ]
                        },
                        {
                            'text': 'The earth is round.',
                            'question_type': 'true_false',
                            'marks': 5,
                            'order': 1,
                            'choices_data': [
                                {'text': 'False', 'is_correct': False, 'order': 0},
                                {'text': 'True', 'is_correct': True, 'order': 1}
                            ]
                        }
                    ]
                }
                check_endpoint('POST', '/api/quizzes/quizzes/', tutor, quiz_payload, expected_status=[201])
            else:
                self.stdout.write(self.style.WARNING('Tutor has no course; skipping quiz creation'))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR("Tutor user not found"))
        
        # 3. Student Tests
        try:
            student = User.objects.get(username='student1')
            self.stdout.write('\n--- Testing Student Endpoints ---')
            check_endpoint('GET', '/api/auth/profile/', student)
            check_endpoint('GET', '/api/courses/courses/', student)
            check_endpoint('GET', '/api/courses/my-enrollments/', student)
            
            # Get a course and quiz
            course = Course.objects.first()
            quiz = Quiz.objects.filter(course=course).first()
            
            if course:
                self.stdout.write(f'\n--- Testing Course Details ({course.id}) ---')
                check_endpoint('GET', f'/api/courses/courses/{course.id}/', student)
            
            if quiz:
                self.stdout.write(f'\n--- Testing Quiz Flow ({quiz.id}) ---')
                check_endpoint('GET', f'/api/quizzes/quizzes/{quiz.id}/', student)
                
                # Start Quiz
                res = check_endpoint('POST', f'/api/quizzes/quizzes/{quiz.id}/start/', student)
                
                attempt_id = None
                if res.status_code in [200, 201]:
                    data = res.json()
                    if 'attempt' in data:
                        attempt_id = data['attempt']['id']
                    else:
                        attempt_id = data.get('id')
                
                if attempt_id:
                    self.stdout.write(f'Attempt ID: {attempt_id}')
                    # Submit Answer
                    question = quiz.questions.first()
                    if question:
                        choice = question.choices.first()
                        if choice:
                            data = {
                                'question_id': question.id,
                                'choice_id': choice.id
                            }
                            self.stdout.write(f'Submitting answer for Q: {question.id}, Choice: {choice.id}')
                            check_endpoint('POST', f'/api/quizzes/attempts/{attempt_id}/submit/', student, data)
                        else:
                            self.stdout.write('No choices found for question')
                    else:
                        self.stdout.write('No questions found for quiz')
                    
                    # Complete Quiz
                    check_endpoint('POST', f'/api/quizzes/attempts/{attempt_id}/complete/', student)
            
            # Interview Flow
            self.stdout.write('\n--- Testing Interview Flow ---')
            # Check available slots
            check_endpoint('GET', '/api/interviews/slots/available/', student)
            
            # Book a slot
            new_slot = InterviewSlot.objects.create(
                interviewer=tutor,
                date=timezone.now().date() + timedelta(days=15),
                start_time='14:00:00',
                end_time='15:00:00',
                status='available'
            )
            
            book_data = {
                'slot_id': new_slot.id,
                'course_id': course.id if course else None
            }
            if course:
                check_endpoint('POST', '/api/interviews/slots/book/', student, book_data)
            
            check_endpoint('GET', '/api/interviews/slots/my-bookings/', student)

            # Chat Flow
            self.stdout.write('\n--- Testing Chat Flow ---')
            check_endpoint('GET', '/api/chat/rooms/', student)
            
            # Create Room
            room_name = f'api_test_room_{uuid.uuid4().hex[:8]}'
            room_data = {
                'name': room_name,
                'room_type': 'one_on_one',
                'participants': [tutor.id]
            }
            res = check_endpoint('POST', '/api/chat/rooms/create/', student, room_data, expected_status=[201])
            
            if res.status_code == 201:
                room_id = res.data['id']
                # Send Message
                msg_data = {'content': 'API verification message'}
                check_endpoint('POST', f'/api/chat/rooms/{room_id}/messages/', student, msg_data, expected_status=[201])
                
                # Get Messages
                check_endpoint('GET', f'/api/chat/rooms/{room_id}/messages/', student)
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR("Student user not found"))
            
        self.stdout.write(self.style.SUCCESS('\nVerification Complete'))
