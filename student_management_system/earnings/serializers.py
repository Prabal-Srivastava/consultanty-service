from rest_framework import serializers
from .models import Earning, PayoutRequest
from accounts.serializers import UserSerializer

class EarningSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    
    class Meta:
        model = Earning
        fields = '__all__'
        read_only_fields = ['tutor', 'amount', 'admin_commission', 'net_earning', 'source_type', 'course_enrollment', 'consultancy_session', 'created_at']

class PayoutRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutRequest
        fields = '__all__'
        read_only_fields = ['tutor', 'status', 'transaction_id', 'processed_at', 'requested_at']

    def validate_amount(self, value):
        # Check if tutor has enough available earnings
        user = self.context['request'].user
        
        # Calculate available balance
        total_earned = sum(e.net_earning for e in Earning.objects.filter(tutor=user, status='available'))
        total_withdrawn = sum(p.amount for p in PayoutRequest.objects.filter(tutor=user, status__in=['requested', 'processed']))
        
        available_balance = total_earned - total_withdrawn
        
        if value > available_balance:
            raise serializers.ValidationError(f"Insufficient funds. Available balance: {available_balance}")
        
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
            
        return value
