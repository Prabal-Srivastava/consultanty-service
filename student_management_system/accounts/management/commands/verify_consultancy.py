from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from consultancy.models import ConsultancySession
from earnings.models import Earning
from rest_framework.test import APIClient
from django.utils import timezone
import datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Verify Consultancy Module flow'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting Consultancy Verification...')
        client = APIClient()
        
        # Setup users
        student = User.objects.filter(user_type='student').first()
        tutor = User.objects.filter(user_type='tutor', is_approved=True).first()
        
        if not student or not tutor:
            self.stdout.write(self.style.ERROR('Student or Tutor not found. Run seed_full_db first.'))
            return

        self.stdout.write(f'Using Student: {student.username}, Tutor: {tutor.username}')

        # 1. Create Consultancy Session (Booking)
        self.stdout.write('\n--- 1. Testing Session Booking ---')
        
        # Define session details
        session_date = datetime.date.today() + datetime.timedelta(days=1)
        start_time = datetime.time(14, 0)
        end_time = datetime.time(15, 0)
        price = 500
        
        client.force_authenticate(user=student)
        
        # Create pending session manually to simulate the booking request
        session = ConsultancySession.objects.create(
            student=student,
            consultant=tutor,
            problem_statement='Verification Test Problem',
            date=session_date,
            start_time=start_time,
            end_time=end_time,
            status='pending',
            price=price
        )
        self.stdout.write(f'Created Pending Session: {session.id}')

        # 2. Payment Flow
        self.stdout.write('\n--- 2. Testing Payment Integration ---')
        
        # Generate QR
        # Note: Adjust endpoint path if necessary based on project urls
        response = client.post('/api/payments/payments/upi/generate/', {'session_id': session.id})
        
        if response.status_code == 200:
            payment_id = response.data.get('payment_id')
            self.stdout.write(f'Payment Initiated: {payment_id}')
            
            if payment_id:
                # Verify Payment
                res = client.post('/api/payments/payments/upi/verify/', {'payment_id': payment_id})
                if res.status_code == 200:
                    self.stdout.write(self.style.SUCCESS('Payment Verified Successfully'))
                    
                    # 3. Verify Session Status Update
                    self.stdout.write('\n--- 3. Verifying Session Status ---')
                    session.refresh_from_db()
                    if session.status == 'booked':
                        self.stdout.write(self.style.SUCCESS(f'Session {session.id} is now BOOKED'))
                    else:
                        self.stdout.write(self.style.ERROR(f'Session status is {session.status}, expected BOOKED'))
                        
                    # 4. Verify Tutor Earning
                    self.stdout.write('\n--- 4. Verifying Tutor Earnings ---')
                    earning = Earning.objects.filter(
                        tutor=tutor, 
                        source_type='consultancy_session', 
                        amount=price
                    ).last()
                    
                    if earning:
                        self.stdout.write(self.style.SUCCESS(f'Earning Record Found: {earning.net_earning} (Status: {earning.status})'))
                    else:
                        self.stdout.write(self.style.ERROR('Earning Record NOT Found'))
                        
                else:
                    self.stdout.write(self.style.ERROR(f'Payment Verification Failed: {res.data}'))
            else:
                 self.stdout.write(self.style.ERROR('No payment_id returned'))
        else:
            self.stdout.write(self.style.ERROR(f'QR Generation Failed: {response.data}'))
            if response.status_code == 404:
                self.stdout.write(self.style.WARNING('Endpoint not found. Check if payments URL is registered correctly.'))
