from django.db import models
from django.conf import settings
from courses.models import Course, Enrollment
from consultancy.models import ConsultancySession

class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    )
    
    PAYMENT_METHOD_CHOICES = (
        ('stripe', 'Stripe'),
        ('razorpay', 'Razorpay'),
        ('upi', 'UPI'),
        ('manual', 'Manual'),
    )
    
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'user_type': 'student'}, related_name='payments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='payment', null=True, blank=True)
    consultancy_session = models.OneToOneField(ConsultancySession, on_delete=models.CASCADE, related_name='payment', null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='stripe')
    payment_intent_id = models.CharField(max_length=100, blank=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment {self.id} - {self.student.username} - {self.course.title}"

    class Meta:
        ordering = ['-created_at']

class Installment(models.Model):
    INSTALLMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    )
    
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='installments')
    installment_number = models.IntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateTimeField()
    paid_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=INSTALLMENT_STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Installment {self.installment_number} - Payment {self.payment.id}"
    
    class Meta:
        ordering = ['due_date']
        unique_together = ['payment', 'installment_number']

class Refund(models.Model):
    REFUND_STATUS_CHOICES = (
        ('requested', 'Requested'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('rejected', 'Rejected'),
    )
    
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=REFUND_STATUS_CHOICES, default='requested')
    refund_id = models.CharField(max_length=100, blank=True)
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_refunds')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Refund {self.id} - Payment {self.payment.id}"

    class Meta:
        ordering = ['-created_at']

class MoneyBackGuarantee(models.Model):
    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='money_back_guarantee')
    is_eligible = models.BooleanField(default=True)
    job_offer_date = models.DateTimeField(null=True, blank=True)
    guarantee_expiry_date = models.DateTimeField()
    refund_processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Money Back Guarantee - {self.enrollment.student.username}"
    
    class Meta:
        ordering = ['-created_at']