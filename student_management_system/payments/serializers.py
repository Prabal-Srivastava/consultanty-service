from rest_framework import serializers
from .models import Payment, Installment, Refund, MoneyBackGuarantee
from accounts.serializers import UserSerializer
from courses.serializers import CourseSerializer

class InstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installment
        fields = ('id', 'installment_number', 'amount', 'due_date', 'paid_date', 'status', 'transaction_id')
        read_only_fields = ('id', 'status', 'paid_date', 'transaction_id')

class PaymentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    installments = InstallmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Payment
        fields = ('id', 'student', 'course', 'amount', 'currency', 'payment_method', 
                 'payment_intent_id', 'payment_status', 'transaction_id', 'installments', 'created_at')
        read_only_fields = ('id', 'student', 'payment_status', 'transaction_id', 'created_at')

class RefundSerializer(serializers.ModelSerializer):
    payment = PaymentSerializer(read_only=True)
    processed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Refund
        fields = ('id', 'payment', 'amount', 'reason', 'status', 'refund_id', 'processed_by', 'created_at')
        read_only_fields = ('id', 'status', 'refund_id', 'processed_by', 'created_at')

class MoneyBackGuaranteeSerializer(serializers.ModelSerializer):
    enrollment = serializers.SerializerMethodField()
    
    class Meta:
        model = MoneyBackGuarantee
        fields = ('id', 'enrollment', 'is_eligible', 'job_offer_date', 'guarantee_expiry_date', 'refund_processed', 'created_at')
        read_only_fields = ('id', 'created_at', 'refund_processed')
    
    def get_enrollment(self, obj):
        from courses.serializers import EnrollmentListSerializer
        return EnrollmentListSerializer(obj.enrollment).data

class CreatePaymentSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=['stripe', 'razorpay'], default='stripe')
    installment_plan = serializers.BooleanField(default=False)
    
    def validate_course_id(self, value):
        from courses.models import Course
        try:
            course = Course.objects.get(id=value, is_active=True)
            return value
        except Course.DoesNotExist:
            raise serializers.ValidationError("Course not found or inactive")

class CreateInstallmentSerializer(serializers.Serializer):
    payment_id = serializers.IntegerField()
    installment_count = serializers.IntegerField(min_value=2, max_value=12, default=2)
    
    def validate_payment_id(self, value):
        try:
            payment = Payment.objects.get(id=value, student=self.context['request'].user)
            return value
        except Payment.DoesNotExist:
            raise serializers.ValidationError("Payment not found")