from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from courses.models import Course, Enrollment
from payments.models import Payment
from django.utils import timezone
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Verifies UPI Payment Flow'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting UPI Payment verification...')
        client = APIClient()

        # 1. Setup Data
        student = User.objects.get(username='student1')
        course = Course.objects.first()
        
        # Ensure clean state (remove existing enrollment/payment)
        Enrollment.objects.filter(student=student, course=course).delete()
        Payment.objects.filter(student=student, course=course).delete()

        client.force_authenticate(user=student)

        # 2. Generate UPI QR
        response = client.post('/api/payments/payments/upi/generate/', {
            'course_id': course.id
        })

        if response.status_code != 200:
            self.stdout.write(self.style.ERROR(f'Generate QR failed: {response.data}'))
            return

        data = response.data
        payment_id = data['payment_id']
        upi_id = data['upi_id']
        qr_code = data['qr_code']
        
        self.stdout.write(self.style.SUCCESS(f'UPI Payment initiated. ID: {payment_id}'))
        self.stdout.write(f'UPI ID: {upi_id}')
        self.stdout.write(f'QR Code Length: {len(qr_code)}')

        # 3. Verify Payment
        response = client.post('/api/payments/payments/upi/verify/', {
            'payment_id': payment_id
        })

        if response.status_code != 200:
            self.stdout.write(self.style.ERROR(f'Verify Payment failed: {response.data}'))
            return

        self.stdout.write(self.style.SUCCESS('Payment verified successfully'))

        # 4. Check Enrollment Status
        enrollment = Enrollment.objects.get(student=student, course=course)
        if enrollment.is_active:
            self.stdout.write(self.style.SUCCESS('Enrollment is now ACTIVE'))
        else:
            self.stdout.write(self.style.ERROR('Enrollment is NOT ACTIVE'))
