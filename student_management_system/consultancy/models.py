from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal

User = get_user_model()

class ConsultancyService(models.Model):
    """Consultancy service packages offered to organizations"""
    SERVICE_TYPES = [
        ('B2B', 'Business to Business'),
        ('B2C', 'Business to Consumer'),
        ('CORPORATE', 'Corporate Training'),
        ('INDIVIDUAL', 'Individual Coaching'),
    ]
    
    PACKAGE_TYPES = [
        ('BASIC', 'Basic Package'),
        ('STANDARD', 'Standard Package'),
        ('PREMIUM', 'Premium Package'),
        ('ENTERPRISE', 'Enterprise Solution'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    package_type = models.CharField(max_length=20, choices=PACKAGE_TYPES)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    duration_months = models.PositiveIntegerField(default=12)
    students_limit = models.PositiveIntegerField(default=100)
    features = models.JSONField(default=list)  # List of features included
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.package_type})"

class Organization(models.Model):
    """Organizations that purchase consultancy services"""
    ORG_TYPES = [
        ('CORPORATE', 'Corporate'),
        ('EDUCATIONAL', 'Educational Institution'),
        ('GOVERNMENT', 'Government'),
        ('NGO', 'Non-Profit Organization'),
        ('STARTUP', 'Startup'),
    ]
    
    name = models.CharField(max_length=200)
    organization_type = models.CharField(max_length=20, choices=ORG_TYPES)
    contact_person = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    website = models.URLField(blank=True, null=True)
    total_students = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class ConsultancyContract(models.Model):
    """Contracts between organization and consultancy service"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING_APPROVAL', 'Pending Approval'),
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='contracts')
    service = models.ForeignKey(ConsultancyService, on_delete=models.CASCADE)
    admin_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='managed_contracts')
    start_date = models.DateField()
    end_date = models.DateField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.organization.name} - {self.service.name}"
    
    @property
    def remaining_amount(self):
        return self.total_amount - self.amount_paid

    @property
    def progress_percentage(self):
        if self.total_amount > 0:
            return (self.amount_paid / self.total_amount) * 100
        return 0

class SuccessStory(models.Model):
    """Success stories of students/clients"""
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)  # e.g., "Software Engineer at Google"
    story = models.TextField()
    photo = models.FileField(upload_to='success_stories/', blank=True, null=True)
    is_job_placement = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Success Stories"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.role}"

class FAQ(models.Model):
    """Frequently Asked Questions"""
    question = models.CharField(max_length=255)
    answer = models.TextField()
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'question']

    def __str__(self):
        return self.question

class ConsultancySession(models.Model):
    """Individual consultancy sessions for students"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consultancy_sessions_as_student')
    consultant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consultancy_sessions_as_consultant')
    problem_statement = models.TextField()
    attached_file = models.FileField(upload_to='consultancy/problems/', blank=True, null=True)
    
    # Booking details
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    price = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    
    # Status
    STATUS_CHOICES = (
        ('pending', 'Pending Payment'),
        ('booked', 'Booked'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Output
    report = models.FileField(upload_to='consultancy/reports/', blank=True, null=True)
    solution_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-start_time']
        
    def __str__(self):
        return f"Session: {self.student.username} with {self.consultant.username}"

class StudentEnrollment(models.Model):
    """Student enrollment through consultancy contracts"""
    contract = models.ForeignKey(ConsultancyContract, on_delete=models.CASCADE, related_name='student_enrollments')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consultancy_enrollments')
    enrollment_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['contract', 'student']
        ordering = ['-enrollment_date']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.contract.organization.name}"

class ConsultancyReport(models.Model):
    """Performance and analytics reports for consultancy services"""
    contract = models.ForeignKey(ConsultancyContract, on_delete=models.CASCADE, related_name='reports')
    report_date = models.DateField()
    total_students = models.PositiveIntegerField()
    active_students = models.PositiveIntegerField()
    completed_students = models.PositiveIntegerField()
    placement_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    average_quiz_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    interview_completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    revenue_generated = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-report_date']
        unique_together = ['contract', 'report_date']
    
    def __str__(self):
        return f"Report for {self.contract} - {self.report_date}"