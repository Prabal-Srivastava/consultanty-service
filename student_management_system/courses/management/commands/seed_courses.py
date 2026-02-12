
import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import Subject, Course
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with initial course data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        # Create Subjects
        subjects = [
            'Mathematics', 'Physics', 'Chemistry', 'Biology', 
            'Computer Science', 'English', 'History', 'Economics'
        ]
        
        created_subjects = []
        for name in subjects:
            subject, created = Subject.objects.get_or_create(name=name)
            created_subjects.append(subject)
            if created:
                self.stdout.write(f'Created subject: {name}')

        # Create or Get Tutor
        tutor_email = 'tutor@example.com'
        tutor, created = User.objects.get_or_create(
            username='tutor',
            defaults={
                'email': tutor_email,
                'first_name': 'John',
                'last_name': 'Doe',
                'user_type': 'tutor',
                'is_active': True
            }
        )
        if created:
            tutor.set_password('password123')
            tutor.save()
            self.stdout.write(f'Created tutor: {tutor.username}')

        # Create Courses
        course_titles = [
            ('Algebra I', 'Mathematics'),
            ('Calculus 101', 'Mathematics'),
            ('Classical Mechanics', 'Physics'),
            ('Organic Chemistry', 'Chemistry'),
            ('Intro to Python', 'Computer Science'),
            ('Web Development Bootcamp', 'Computer Science'),
            ('Creative Writing', 'English'),
            ('World War II', 'History')
        ]

        for title, subject_name in course_titles:
            subject = Subject.objects.get(name=subject_name)
            Course.objects.get_or_create(
                title=title,
                defaults={
                    'subject': subject,
                    'tutor': tutor,
                    'description': f'This is a comprehensive course on {title}. Learn everything you need to know about {subject_name}.',
                    'fee': Decimal(random.randint(2000, 10000)),
                    'duration': random.randint(4, 12),
                    'is_active': True
                }
            )
            self.stdout.write(f'Created course: {title}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded courses'))
