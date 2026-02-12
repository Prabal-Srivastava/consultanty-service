import stripe
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from .models import Payment, Installment, Refund, MoneyBackGuarantee
from .serializers import PaymentSerializer, InstallmentSerializer, RefundSerializer, MoneyBackGuaranteeSerializer, CreatePaymentSerializer, CreateInstallmentSerializer
from courses.models import Course, Enrollment
from consultancy.models import ConsultancySession
from earnings.models import Earning
from notifications.utils import send_notification
import qrcode
import io
import base64

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_upi_qr(request):
    """Generate UPI QR code for payment"""
    course_id = request.data.get('course_id')
    session_id = request.data.get('session_id')
    installment_plan = request.data.get('installment_plan', False)
    
    if course_id:
        course = get_object_or_404(Course, id=course_id)
        
        # Check if enrollment exists
        if Enrollment.objects.filter(student=request.user, course=course).exists():
            # Check if payment is pending
            enrollment = Enrollment.objects.get(student=request.user, course=course)
            if enrollment.is_active:
                # Check for unpaid installments
                payment = Payment.objects.filter(student=request.user, course=course, enrollment=enrollment).first()
                if payment:
                    pending_installment = payment.installments.filter(status='pending').order_by('installment_number').first()
                    if not pending_installment:
                         return Response({'error': 'Already enrolled and fully paid'}, status=400)
            else:
                 # Inactive enrollment, might have pending payment
                 pass
        else:
            # Create enrollment
            enrollment = Enrollment.objects.create(student=request.user, course=course, is_active=False)
    
        # Check for existing pending payment
        payment = Payment.objects.filter(student=request.user, course=course, enrollment=enrollment).first()
        
        if not payment:
            payment = Payment.objects.create(
                student=request.user,
                course=course,
                enrollment=enrollment,
                amount=course.fee,
                payment_method='upi',
                currency='INR',
                payment_status='pending'
            )
            
            # Create Installments
            if installment_plan:
                # 50% now, 50% later
                half_amount = course.fee / 2
                Installment.objects.create(payment=payment, installment_number=1, amount=half_amount, due_date=timezone.now(), status='pending')
                Installment.objects.create(payment=payment, installment_number=2, amount=half_amount, due_date=timezone.now() + timedelta(days=30), status='pending')
            else:
                Installment.objects.create(payment=payment, installment_number=1, amount=course.fee, due_date=timezone.now(), status='pending')
        
        # Get next pending installment
        installment = payment.installments.filter(status='pending').order_by('installment_number').first()
        if not installment:
             return Response({'error': 'No pending installments'}, status=400)
             
        description = f"Course Fee - Installment {installment.installment_number}"
        amount = installment.amount
        tr_id = f"{payment.id}-{installment.installment_number}" # Unique ID for QR

    elif session_id:
        session = get_object_or_404(ConsultancySession, id=session_id)
        if session.student != request.user:
             return Response({'error': 'Not authorized'}, status=403)
        if session.status != 'pending': 
             return Response({'error': 'Session is not pending payment'}, status=400)
             
        payment = Payment.objects.filter(student=request.user, consultancy_session=session, payment_status='pending').first()
        
        amount = session.price
        
        if not payment:
             payment = Payment.objects.create(
                 student=request.user,
                 consultancy_session=session,
                 amount=amount,
                 payment_method='upi',
                 currency='INR',
                 payment_status='pending'
             )
        
        description = "Consultancy Session Fee"
        tr_id = str(payment.id)
        
    else:
        return Response({'error': 'course_id or session_id required'}, status=400)
    
    # UPI URL Format
    upi_id = "demo@upi" 
    upi_url = f"upi://pay?pa={upi_id}&pn=StudentSystem&am={amount}&tr={tr_id}&tn={description}"
    
    # Generate QR
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(upi_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return Response({
        'payment_id': payment.id,
        'upi_id': upi_id,
        'qr_code': f"data:image/png;base64,{img_str}",
        'amount': amount,
        'message': 'Scan this QR code with any UPI app'
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_upi_payment(request):
    """Simulate UPI payment success"""
    payment_id = request.data.get('payment_id')
    payment = get_object_or_404(Payment, id=payment_id, student=request.user)
    
    if payment.payment_status == 'completed':
        # Check if any pending installment exists
        pending = payment.installments.filter(status='pending').exists()
        if not pending:
             return Response({'status': 'success', 'message': 'Payment already verified'})
    
    if payment.enrollment:
        # Get pending installment
        installment = payment.installments.filter(status='pending').order_by('installment_number').first()
        if installment:
            installment.status = 'paid'
            installment.paid_date = timezone.now()
            installment.save()
            
            # If 1st installment paid, activate enrollment
            if installment.installment_number == 1:
                payment.enrollment.is_active = True
                payment.enrollment.save()
            
            # Check if all installments paid
            if not payment.installments.filter(status='pending').exists():
                payment.payment_status = 'completed'
                payment.save()
            else:
                payment.payment_status = 'processing' # Partially paid
                payment.save()

            # Create Earning for Tutor
            if payment.course and payment.course.tutor:
                commission_rate = 0.10 # 10% commission
                commission = installment.amount *  type(installment.amount)(commission_rate)
                Earning.objects.create(
                    tutor=payment.course.tutor,
                    student=request.user,
                    amount=installment.amount,
                    admin_commission=commission,
                    source_type='course_enrollment',
                    course_enrollment=payment.enrollment,
                    status='available'
                )
                
                # Notify Tutor
                send_notification(
                    recipient=payment.course.tutor,
                    title='New Earning',
                    message=f'You have earned {installment.amount} from student {request.user.username}.',
                    notification_type='earning',
                    link='/earnings/'
                )

            # Notify Student
            send_notification(
                recipient=request.user,
                title='Payment Successful',
                message=f'Your payment of {installment.amount} for course "{payment.course.title}" was successful.',
                notification_type='payment',
                link=f'/courses/{payment.course.id}'
            )
            
            return Response({'status': 'success', 'message': f'Installment {installment.installment_number} verified'})

    elif payment.consultancy_session:
        payment.payment_status = 'completed'
        payment.save()

        payment.consultancy_session.status = 'booked'
        payment.consultancy_session.save()
        
        # Create Earning for Consultant
        if payment.consultancy_session.consultant:
             commission_rate = 0.10 # 10% commission
             commission = payment.amount * type(payment.amount)(commission_rate)
             Earning.objects.create(
                 tutor=payment.consultancy_session.consultant,
                 student=request.user,
                 amount=payment.amount,
                 admin_commission=commission,
                 source_type='consultancy_session',
                 consultancy_session=payment.consultancy_session,
                 status='available'
             )

             # Notify Consultant
             send_notification(
                 recipient=payment.consultancy_session.consultant,
                 title='New Consultancy Session',
                 message=f'You have a new session with {request.user.username}.',
                 notification_type='booking',
                 link=f'/consultancy/sessions/{payment.consultancy_session.id}'
             )

        # Notify Student
        send_notification(
            recipient=request.user,
            title='Consultancy Booking Confirmed',
            message=f'Your consultancy session with {payment.consultancy_session.consultant.username} is booked.',
            notification_type='booking',
            link=f'/consultancy/sessions/{payment.consultancy_session.id}'
        )
        
        return Response({'status': 'success', 'message': 'Payment verified and session booked'})
    
    return Response({'status': 'error', 'message': 'Invalid payment type'}, status=400)

class PaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(student=self.request.user)

class PaymentDetailView(generics.RetrieveAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(student=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_payment_intent(request):
    """Create a Stripe payment intent for course enrollment"""
    if request.user.user_type != 'student':
        return Response({
            'error': 'Only students can make payments'
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = CreatePaymentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    course_id = serializer.validated_data['course_id']
    payment_method = serializer.validated_data['payment_method']
    installment_plan = serializer.validated_data['installment_plan']
    
    course = get_object_or_404(Course, id=course_id, is_active=True)
    
    # Check if already enrolled
    if Enrollment.objects.filter(student=request.user, course=course, is_active=True).exists():
        return Response({
            'error': 'You are already enrolled in this course'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create enrollment first
    enrollment = Enrollment.objects.create(
        student=request.user,
        course=course
    )
    
    # Create payment
    payment = Payment.objects.create(
        student=request.user,
        course=course,
        enrollment=enrollment,
        amount=course.fee,
        payment_method=payment_method,
        currency='USD'
    )
    
    if installment_plan:
        # Create installment plan (50% now, 50% later)
        half_amount = course.fee / 2
        
        # First installment (due now)
        Installment.objects.create(
            payment=payment,
            installment_number=1,
            amount=half_amount,
            due_date=timezone.now(),
            status='pending'
        )
        
        # Second installment (due in 30 days)
        Installment.objects.create(
            payment=payment,
            installment_number=2,
            amount=half_amount,
            due_date=timezone.now() + timedelta(days=30),
            status='pending'
        )
    else:
        # Single payment
        Installment.objects.create(
            payment=payment,
            installment_number=1,
            amount=course.fee,
            due_date=timezone.now(),
            status='pending'
        )
    
    # Create Stripe Payment Intent
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(course.fee * 100),  # Stripe expects amount in cents
            currency='usd',
            metadata={
                'payment_id': payment.id,
                'student_id': request.user.id,
                'course_id': course.id
            }
        )
        
        payment.payment_intent_id = intent.id
        payment.save()
        
        # Create money back guarantee
        MoneyBackGuarantee.objects.create(
            enrollment=enrollment,
            guarantee_expiry_date=timezone.now() + timedelta(days=90)  # 3 months guarantee
        )
        
        return Response({
            'client_secret': intent.client_secret,
            'payment_id': payment.id
        })
        
    except stripe.error.StripeError as e:
        payment.payment_status = 'failed'
        payment.save()
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_payment(request):
    """Confirm payment after successful Stripe payment"""
    payment_id = request.data.get('payment_id')
    payment_intent_id = request.data.get('payment_intent_id')
    
    if not payment_id or not payment_intent_id:
        return Response({
            'error': 'Payment ID and Payment Intent ID are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    payment = get_object_or_404(Payment, id=payment_id, student=request.user)
    
    try:
        # Verify payment with Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status == 'succeeded':
            payment.payment_status = 'completed'
            payment.transaction_id = intent.id
            payment.save()
            
            # Update first installment as paid
            first_installment = payment.installments.first()
            if first_installment:
                first_installment.status = 'paid'
                first_installment.paid_date = timezone.now()
                first_installment.transaction_id = intent.id
                first_installment.save()
            
            # Activate enrollment
            payment.enrollment.is_active = True
            payment.enrollment.save()
            
            serializer = PaymentSerializer(payment)
            return Response({
                'message': 'Payment confirmed successfully',
                'payment': serializer.data
            })
        else:
            return Response({
                'error': 'Payment not completed'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except stripe.error.StripeError as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_refund(request, payment_id):
    """Request refund for a payment"""
    payment = get_object_or_404(Payment, id=payment_id, student=request.user)
    
    if payment.payment_status != 'completed':
        return Response({
            'error': 'Only completed payments can be refunded'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if money back guarantee is still valid
    try:
        guarantee = payment.enrollment.money_back_guarantee
        if not guarantee.is_eligible or guarantee.refund_processed:
            return Response({
                'error': 'Refund not eligible'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if timezone.now() > guarantee.guarantee_expiry_date:
            return Response({
                'error': 'Guarantee period has expired'
            }, status=status.HTTP_400_BAD_REQUEST)
    except MoneyBackGuarantee.DoesNotExist:
        return Response({
            'error': 'No money back guarantee found'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create refund request
    refund = Refund.objects.create(
        payment=payment,
        amount=payment.amount,
        reason='Money back guarantee - no job offer received'
    )
    
    serializer = RefundSerializer(refund)
    return Response({
        'message': 'Refund request submitted successfully',
        'refund': serializer.data
    })

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def process_refund(request, refund_id):
    """Process refund (Admin only)"""
    refund = get_object_or_404(Refund, id=refund_id, status='requested')
    
    try:
        # Process refund through Stripe
        refund_intent = stripe.Refund.create(
            payment_intent=refund.payment.payment_intent_id,
            amount=int(refund.amount * 100)
        )
        
        refund.status = 'completed'
        refund.refund_id = refund_intent.id
        refund.processed_by = request.user
        refund.save()
        
        # Update payment status
        refund.payment.payment_status = 'refunded'
        refund.payment.save()
        
        # Update money back guarantee
        guarantee = refund.payment.enrollment.money_back_guarantee
        guarantee.refund_processed = True
        guarantee.save()
        
        # Deactivate enrollment
        refund.payment.enrollment.is_active = False
        refund.payment.enrollment.save()
        
        serializer = RefundSerializer(refund)
        return Response({
            'message': 'Refund processed successfully',
            'refund': serializer.data
        })
        
    except stripe.error.StripeError as e:
        refund.status = 'failed'
        refund.save()
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_installments(request):
    """Get all installments for current user"""
    payments = Payment.objects.filter(student=request.user)
    installments = Installment.objects.filter(payment__in=payments).order_by('due_date')
    
    serializer = InstallmentSerializer(installments, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def job_offer_received(request, enrollment_id):
    """Mark job offer received for money back guarantee"""
    from courses.models import Enrollment
    enrollment = get_object_or_404(Enrollment, id=enrollment_id, student=request.user)
    
    try:
        guarantee = enrollment.money_back_guarantee
        guarantee.job_offer_date = timezone.now()
        guarantee.is_eligible = False  # No longer eligible for refund
        guarantee.save()
        
        serializer = MoneyBackGuaranteeSerializer(guarantee)
        return Response({
            'message': 'Job offer recorded successfully',
            'guarantee': serializer.data
        })
    except MoneyBackGuarantee.DoesNotExist:
        return Response({
            'error': 'No money back guarantee found for this enrollment'
        }, status=status.HTTP_404_NOT_FOUND)