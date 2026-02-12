
import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from courses.models import Subject, Course, Enrollment, CourseMaterial
from quizzes.models import Quiz, Question, Choice
from interviews.models import InterviewSlot, InterviewBooking
from consultancy.models import (
    ConsultancyService, Organization, ConsultancyContract, 
    StudentEnrollment, ConsultancyReport, ConsultancySession,
    SuccessStory, FAQ
)

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with comprehensive demo data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting full database seed...')

        # 1. Users
        self.stdout.write('Creating users...')
        
        # Admin
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'first_name': 'Super',
                'last_name': 'Admin',
                'user_type': 'admin',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write('Created admin: admin/admin123')

        # Tutors
        tutors = []
        for i in range(1, 4):
            tutor, created = User.objects.get_or_create(
                username=f'tutor{i}',
                defaults={
                    'email': f'tutor{i}@example.com',
                    'first_name': f'Tutor',
                    'last_name': f'{i}',
                    'user_type': 'tutor',
                    'is_active': True,
                    'is_approved': True
                }
            )
            if created:
                tutor.set_password('password123')
                tutor.save()
                self.stdout.write(f'Created tutor: {tutor.username}/password123')
            else:
                if not tutor.is_approved:
                    tutor.is_approved = True
                    tutor.save()
                    self.stdout.write(f'Updated tutor approval: {tutor.username}')
            tutors.append(tutor)

        # Students
        students = []
        for i in range(1, 6):
            student, created = User.objects.get_or_create(
                username=f'student{i}',
                defaults={
                    'email': f'student{i}@example.com',
                    'first_name': f'Student',
                    'last_name': f'{i}',
                    'user_type': 'student',
                    'is_active': True
                }
            )
            if created:
                student.set_password('password123')
                student.save()
                self.stdout.write(f'Created student: {student.username}/password123')
            students.append(student)

        # 2. Subjects & Courses
        self.stdout.write('Creating subjects and courses...')
        subjects_data = ['Mathematics', 'Physics', 'Computer Science', 'English']
        
        for sub_name in subjects_data:
            subject, _ = Subject.objects.get_or_create(name=sub_name)
            
            # Create 2 courses per subject
            for i in range(1, 3):
                tutor = random.choice(tutors)
                course, created = Course.objects.get_or_create(
                    title=f'{sub_name} {i}0{i}',
                    defaults={
                        'subject': subject,
                        'tutor': tutor,
                        'description': f'Learn the basics of {sub_name} in this comprehensive course.',
                        'fee': Decimal(random.randint(2000, 8000)),
                        'duration': 8,
                        'is_active': True
                    }
                )
                if created:
                    # Create Course Materials
                    for m in range(1, 6):
                        CourseMaterial.objects.create(
                            course=course,
                            title=f'Lesson {m}',
                            description='This is dummy content for the lesson.',
                            order=m,
                            video_url='https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                        )

                    # Create Quiz
                    quiz = Quiz.objects.create(
                        course=course,
                        title=f'{course.title} Final Quiz',
                        description='Test your knowledge',
                        duration=30
                    )
                    
                    # Create Questions
                    for q in range(1, 6):
                        question = Question.objects.create(
                            quiz=quiz,
                            text=f'Question {q} for {course.title}?',
                            marks=10,
                            question_type='multiple_choice'
                        )
                        # Choices
                        for c in range(1, 5):
                            is_correct = (c == 1)
                            Choice.objects.create(
                                question=question,
                                text=f'Option {c}',
                                is_correct=is_correct
                            )
                
                # Enroll random students
                for student in random.sample(students, 3):
                    Enrollment.objects.get_or_create(
                        student=student,
                        course=course,
                        defaults={'is_active': True}
                    )

        # 3. Interviews
        self.stdout.write('Creating interview slots...')
        for tutor in tutors:
            # Create slots for next 7 days
            for day in range(1, 8):
                date = timezone.now().date() + timedelta(days=day)
                for hour in range(9, 17): # 9 AM to 5 PM
                    # Create separate date and time objects
                    slot_date = date
                    start_time = (timezone.datetime.min + timedelta(hours=hour)).time()
                    end_time = (timezone.datetime.min + timedelta(hours=hour + 1)).time()
                    
                    slot, created = InterviewSlot.objects.get_or_create(
                        interviewer=tutor,
                        date=slot_date,
                        start_time=start_time,
                        end_time=end_time,
                        defaults={'status': 'available'}
                    )
                    
                    # Randomly book some slots
                    if created and random.random() < 0.2:
                        student = random.choice(students)
                        InterviewBooking.objects.create(
                            slot=slot,
                            student=student,
                            course=Course.objects.filter(tutor=tutor).first(),
                            is_confirmed=True
                        )
                        slot.status = 'booked'
                        slot.save()

        # 4. Chat Rooms
        self.stdout.write('Creating chat rooms...')
        for student in students:
            for tutor in tutors:
                room_name = f'chat_{student.id}_{tutor.id}'
                room, created = Room.objects.get_or_create(
                    name=room_name,
                    defaults={'room_type': 'one_on_one'}
                )
                if created:
                    room.participants.add(student, tutor)

        # 4. Success Stories
        self.stdout.write('Creating success stories...')
        stories_data = [
            {
                'name': 'Priya Sharma',
                'role': 'Process Developer at Genpact',
                'story': 'The R2R training and interview prep at Arpit Consultancy helped me land my role at Genpact. The domain knowledge they shared was invaluable.',
                'is_job_placement': True
            },
            {
                'name': 'Rahul Verma',
                'role': 'Record to Report Executive at EXL',
                'story': 'I gained deep insights into financial reporting and general ledger accounting. This practical knowledge was the key to my success at EXL.',
                'is_job_placement': True
            },
            {
                'name': 'Sneha Patel',
                'role': 'FP&A Analyst at Accenture',
                'story': 'The financial planning and analysis module was comprehensive. It gave me the confidence to handle complex budgeting tasks in my current role.',
                'is_job_placement': True
            },
            {
                'name': 'Ankit Kumar',
                'role': 'Record to Report Executive at Infosys',
                'story': 'From journal entries to financial statements, the end-to-end process training made me industry-ready for my career at Infosys.',
                'is_job_placement': True
            }
        ]
        for story_data in stories_data:
            SuccessStory.objects.get_or_create(
                name=story_data['name'],
                defaults={
                    'role': story_data['role'],
                    'story': story_data['story'],
                    'is_job_placement': story_data['is_job_placement']
                }
            )

        # 5. FAQs
        self.stdout.write('Creating FAQs...')
        faqs_data = [
            {
                'question': 'What consultancy services do you offer?',
                'answer': 'We offer B2B and B2C consultancy, including corporate training and individual career coaching.'
            },
            {
                'question': 'How can I join a consultancy session?',
                'answer': 'You can book a session through your student dashboard under the Consultancy section.'
            },
            {
                'question': 'Are the training sessions recorded?',
                'answer': 'Yes, all our live sessions are recorded and made available in your course materials.'
            }
        ]
        for i, faq_data in enumerate(faqs_data):
            FAQ.objects.get_or_create(
                question=faq_data['question'],
                defaults={
                    'answer': faq_data['answer'],
                    'order': i
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded full database!'))
