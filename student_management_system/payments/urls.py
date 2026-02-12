from django.urls import path
from . import views

urlpatterns = [
    # Payment URLs
    path('payments/', views.PaymentListView.as_view(), name='payment-list'),
    path('payments/<int:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    path('payments/create-payment-intent/', views.create_payment_intent, name='create-payment-intent'),
    path('payments/upi/generate/', views.generate_upi_qr, name='generate-upi-qr'),
    path('payments/upi/verify/', views.verify_upi_payment, name='verify-upi-payment'),
    path('payments/confirm/', views.confirm_payment, name='confirm-payment'),
    
    # Refund URLs
    path('payments/<int:payment_id>/refund/', views.request_refund, name='request-refund'),
    path('refunds/<int:refund_id>/process/', views.process_refund, name='process-refund'),
    
    # Installment URLs
    path('installments/', views.my_installments, name='my-installments'),
    
    # Money Back Guarantee URLs
    path('enrollments/<int:enrollment_id>/job-offer/', views.job_offer_received, name='job-offer-received'),
]