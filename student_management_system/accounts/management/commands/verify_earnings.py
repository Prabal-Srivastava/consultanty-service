from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import Course, Enrollment
from consultancy.models import ConsultancySession
from payments.models import Payment
from earnings.models import Earning, PayoutRequest
from rest_framework.test import APIClient
from django.utils import timezone
import datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Verify Earnings and Payouts flow'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting Earnings Verification...')
        client = APIClient()
        
        # Setup users
        student = User.objects.filter(user_type='student').first()
        tutor = User.objects.filter(user_type='tutor', is_approved=True).first()
        
        if not student or not tutor:
            self.stdout.write(self.style.ERROR('Student or Tutor not found. Run seed_full_db first.'))
            return

        # 1. Verify Course Earning
        self.stdout.write('\n--- 1. Testing Course Payment & Earning ---')
        # Create a unique course for testing to avoid "Already enrolled" errors
        course_title = f'Earning Test Course {datetime.datetime.now().strftime("%Y%m%d%H%M%S")}'
        course = Course.objects.create(
            tutor=tutor, 
            title=course_title, 
            description='Test', 
            fee=1000,
            subject_id=1,
            duration=10
        )
            
        client.force_authenticate(user=student)
        
        # Generate QR (Simulate Payment Start)
        response = client.post('/api/payments/payments/upi/generate/', {'course_id': course.id})
        if response.status_code == 200:
            payment_id = response.data['payment_id']
            self.stdout.write(f'Payment initiated: {payment_id}')
            
            # Verify Payment
            res = client.post('/api/payments/payments/upi/verify/', {'payment_id': payment_id})
            if res.status_code == 200:
                self.stdout.write(self.style.SUCCESS('Payment verified'))
                
                # Check Earning
                earning = Earning.objects.filter(tutor=tutor, source_type='course_enrollment', amount=course.fee).last()
                if earning:
                    self.stdout.write(self.style.SUCCESS(f'Earning created: {earning.net_earning} (Status: {earning.status})'))
                else:
                    self.stdout.write(self.style.ERROR('Earning NOT created'))
            else:
                self.stdout.write(self.style.ERROR(f'Payment verification failed: {res.data}'))
        else:
            self.stdout.write(self.style.ERROR(f'QR Generation failed: {response.data}'))

        # 2. Verify Consultancy Earning
        self.stdout.write('\n--- 2. Testing Consultancy Payment & Earning ---')
        # Create pending session
        session = ConsultancySession.objects.create(
            student=student,
            consultant=tutor,
            problem_statement='Test Problem',
            date=datetime.date.today(),
            start_time=datetime.time(10, 0),
            end_time=datetime.time(11, 0),
            status='pending',
            price=500
        )
        
        # Generate QR
        response = client.post('/api/payments/payments/upi/generate/', {'session_id': session.id})
        if response.status_code == 200:
            payment_id = response.data['payment_id']
            self.stdout.write(f'Consultancy Payment initiated: {payment_id}')
            
            # Verify Payment
            res = client.post('/api/payments/payments/upi/verify/', {'payment_id': payment_id})
            if res.status_code == 200:
                self.stdout.write(self.style.SUCCESS('Consultancy Payment verified'))
                
                # Check Session Status
                session.refresh_from_db()
                if session.status == 'booked':
                    self.stdout.write(self.style.SUCCESS('Session status updated to booked'))
                else:
                     self.stdout.write(self.style.ERROR(f'Session status mismatch: {session.status}'))

                # Check Earning
                earning = Earning.objects.filter(tutor=tutor, source_type='consultancy_session', amount=500).last()
                if earning:
                    self.stdout.write(self.style.SUCCESS(f'Consultancy Earning created: {earning.net_earning}'))
                else:
                    self.stdout.write(self.style.ERROR('Consultancy Earning NOT created'))
            else:
                 self.stdout.write(self.style.ERROR(f'Consultancy Payment verification failed: {res.data}'))
        else:
            self.stdout.write(self.style.ERROR(f'Consultancy QR Generation failed: {response.data}'))

        # 3. Verify Payout Request
        self.stdout.write('\n--- 3. Testing Payout Request ---')
        client.force_authenticate(user=tutor)
        
        # Check Stats
        res = client.get('/api/earnings/earnings/stats/')
        if res.status_code == 200:
            balance = res.data['available_balance']
            self.stdout.write(f'Available Balance: {balance}')
            
            if balance > 0:
                # Request Payout
                payout_res = client.post('/api/earnings/payouts/', {'amount': 100})
                if payout_res.status_code == 201:
                     self.stdout.write(self.style.SUCCESS('Payout requested successfully'))
                     
                     # Admin Process
                     admin = User.objects.filter(is_staff=True).first()
                     client.force_authenticate(user=admin)
                     payout_id = payout_res.data['id']
                     
                     process_res = client.post(f'/api/earnings/payouts/{payout_id}/process/', {
                         'action': 'approve',
                         'transaction_id': 'TXN123456',
                         'notes': 'Processed via Bank'
                     })
                     
                     if process_res.status_code == 200:
                         self.stdout.write(self.style.SUCCESS('Payout processed by Admin'))
                     else:
                         self.stdout.write(self.style.ERROR(f'Payout processing failed: {process_res.data}'))
                else:
                     self.stdout.write(self.style.ERROR(f'Payout request failed: {payout_res.data}'))
            else:
                self.stdout.write(self.style.WARNING('Insufficient balance for payout test'))
        else:
            self.stdout.write(self.style.ERROR(f'Stats fetch failed: {res.data}'))

        # 4. Verify Installment Payment
        self.stdout.write('\n--- 4. Testing Installment Payment ---')
        client.force_authenticate(user=student)
        
        # Create a new course for installment test
        course_inst = Course.objects.create(
            tutor=tutor, 
            title='Installment Course', 
            description='Test', 
            fee=2000,
            subject_id=1,
            duration=8
        )
        
        # 4.1 Generate QR for 1st Installment
        response = client.post('/api/payments/payments/upi/generate/', {
            'course_id': course_inst.id,
            'installment_plan': True
        })
        
        if response.status_code == 200:
            payment_id = response.data['payment_id']
            amount = response.data['amount']
            self.stdout.write(f'Installment 1 initiated: {payment_id}, Amount: {amount}')
            
            if float(amount) == 1000.0:
                 self.stdout.write(self.style.SUCCESS('Installment 1 amount correct (50%)'))
            else:
                 self.stdout.write(self.style.ERROR(f'Installment 1 amount incorrect: {amount}'))

            # Verify 1st Payment
            res = client.post('/api/payments/payments/upi/verify/', {'payment_id': payment_id})
            if res.status_code == 200:
                self.stdout.write(self.style.SUCCESS('Installment 1 verified'))
                
                # Check Enrollment Active
                enrollment = Enrollment.objects.filter(student=student, course=course_inst).first()
                if enrollment.is_active:
                    self.stdout.write(self.style.SUCCESS('Enrollment activated after 1st installment'))
                else:
                    self.stdout.write(self.style.ERROR('Enrollment NOT activated'))
                    
                # 4.2 Generate QR for 2nd Installment
                response2 = client.post('/api/payments/payments/upi/generate/', {
                    'course_id': course_inst.id
                })
                
                if response2.status_code == 200:
                    amount2 = response2.data['amount']
                    payment_id_2 = response2.data['payment_id']
                    self.stdout.write(f'Installment 2 initiated: {payment_id_2}, Amount: {amount2}')
                    
                    # Verify 2nd Payment
                    res2 = client.post('/api/payments/payments/upi/verify/', {'payment_id': payment_id_2})
                    if res2.status_code == 200:
                        self.stdout.write(self.style.SUCCESS('Installment 2 verified'))
                        
                        # Check Payment Completed
                        payment = Payment.objects.get(id=payment_id_2)
                        if payment.payment_status == 'completed':
                            self.stdout.write(self.style.SUCCESS('Full payment completed'))
                        else:
                            self.stdout.write(self.style.ERROR(f'Payment status mismatch: {payment.payment_status}'))
                    else:
                        self.stdout.write(self.style.ERROR(f'Installment 2 verification failed: {res2.data}'))
                else:
                    self.stdout.write(self.style.ERROR(f'Installment 2 QR failed: {response2.data}'))
            else:
                self.stdout.write(self.style.ERROR(f'Installment 1 verification failed: {res.data}'))
        else:
             self.stdout.write(self.style.ERROR(f'Installment QR failed: {response.data}'))
