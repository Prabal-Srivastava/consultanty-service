from django.db import models
from django.conf import settings

class Earning(models.Model):
    SOURCE_CHOICES = (
        ('course_enrollment', 'Course Enrollment'),
        ('consultancy_session', 'Consultancy Session'),
        ('interview_session', 'Interview Session'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'), # Payment not yet cleared/confirmed
        ('available', 'Available'), # Ready for withdrawal
        ('withdrawn', 'Withdrawn'), # Paid out
        ('cancelled', 'Cancelled'), # Refunded or invalid
    )

    tutor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='earnings')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments_made')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    admin_commission = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_earning = models.DecimalField(max_digits=10, decimal_places=2)
    
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    
    # We use explicit foreign keys but make them nullable to handle different sources
    # This avoids generic foreign key complexity for this simple use case
    # Note: We are using string references to avoid circular imports if possible, 
    # but for ForeignKey we usually need the class or string 'app.Model'
    
    # We will store ID for flexibility or use GenericForeignKey if needed later. 
    # For now, let's just store metadata or if we really need relations:
    course_enrollment = models.ForeignKey('courses.Enrollment', on_delete=models.SET_NULL, null=True, blank=True)
    consultancy_session = models.ForeignKey('consultancy.ConsultancySession', on_delete=models.SET_NULL, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.net_earning:
            # Default commission logic could be here, but usually passed in
            if self.admin_commission is None:
                self.admin_commission = 0
            self.net_earning = self.amount - self.admin_commission
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"{self.tutor.username} - {self.amount} ({self.status})"

class PayoutRequest(models.Model):
    STATUS_CHOICES = (
        ('requested', 'Requested'),
        ('processed', 'Processed'),
        ('rejected', 'Rejected'),
    )

    tutor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payout_requests')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    transaction_id = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"Payout {self.id} - {self.tutor.username} - {self.amount}"
