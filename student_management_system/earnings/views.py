from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from .models import Earning, PayoutRequest
from .serializers import EarningSerializer, PayoutRequestSerializer

class EarningViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EarningSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Earning.objects.all()
        elif user.user_type == 'tutor':
            return Earning.objects.filter(tutor=user)
        else:
            return Earning.objects.none()

    @decorators.action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        if user.user_type != 'tutor' and not user.is_staff:
             return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
             
        if user.is_staff and request.query_params.get('tutor_id'):
            # Admin viewing specific tutor stats
            from accounts.models import User
            try:
                tutor = User.objects.get(id=request.query_params.get('tutor_id'), user_type='tutor')
            except User.DoesNotExist:
                return Response({'error': 'Tutor not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            tutor = user

        # Calculate stats
        earnings = Earning.objects.filter(tutor=tutor)
        payouts = PayoutRequest.objects.filter(tutor=tutor)
        
        total_earned = earnings.aggregate(sum=Sum('net_earning'))['sum'] or 0
        pending_clearance = earnings.filter(status='pending').aggregate(sum=Sum('net_earning'))['sum'] or 0
        available_balance = earnings.filter(status='available').aggregate(sum=Sum('net_earning'))['sum'] or 0
        
        total_withdrawn = payouts.filter(status='processed').aggregate(sum=Sum('amount'))['sum'] or 0
        pending_withdrawal = payouts.filter(status='requested').aggregate(sum=Sum('amount'))['sum'] or 0
        
        # Real available balance = Available Earnings - (Processed Withdrawals + Pending Withdrawals)
        # Note: In a real system, we might mark earnings as 'withdrawn' when payout is processed
        # But here we calculate dynamically.
        
        # To avoid double counting, let's assume 'available' status in Earning means it CAN be withdrawn.
        # Once withdrawn, we don't change Earning status to 'withdrawn' unless we want to link them 1-to-1.
        # Simpler approach: Balance = (Sum of 'available' earnings) - (Sum of 'requested' + 'processed' payouts)
        
        current_balance = available_balance - (total_withdrawn + pending_withdrawal)
        
        return Response({
            'total_earned': total_earned,
            'pending_clearance': pending_clearance,
            'available_balance': max(0, current_balance), # Should not be negative
            'total_withdrawn': total_withdrawn,
            'pending_withdrawal': pending_withdrawal
        })

class PayoutRequestViewSet(viewsets.ModelViewSet):
    serializer_class = PayoutRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return PayoutRequest.objects.all()
        elif user.user_type == 'tutor':
            return PayoutRequest.objects.filter(tutor=user)
        else:
            return PayoutRequest.objects.none()
            
    def perform_create(self, serializer):
        if self.request.user.user_type != 'tutor':
            raise permissions.PermissionDenied("Only tutors can request payouts")
        serializer.save(tutor=self.request.user)
        
    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def process(self, request, pk=None):
        payout = self.get_object()
        if payout.status != 'requested':
            return Response({'error': 'Payout request is not in requested state'}, status=status.HTTP_400_BAD_REQUEST)
            
        action = request.data.get('action') # 'approve' or 'reject'
        transaction_id = request.data.get('transaction_id', '')
        notes = request.data.get('notes', '')
        
        if action == 'approve':
            payout.status = 'processed'
            payout.transaction_id = transaction_id
            payout.processed_at = timezone.now()
            payout.notes = notes
            payout.save()
            return Response({'message': 'Payout processed successfully'})
            
        elif action == 'reject':
            payout.status = 'rejected'
            payout.notes = notes
            payout.processed_at = timezone.now()
            payout.save()
            return Response({'message': 'Payout rejected'})
            
        else:
            return Response({'error': 'Invalid action. Use "approve" or "reject"'}, status=status.HTTP_400_BAD_REQUEST)
