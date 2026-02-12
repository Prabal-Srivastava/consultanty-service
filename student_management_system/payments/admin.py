from django.contrib import admin
from .models import Payment, Installment, Refund, MoneyBackGuarantee

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'course', 'amount', 'payment_status', 'payment_method', 'created_at')
    list_filter = ('payment_status', 'payment_method', 'created_at', 'course__subject')
    search_fields = ('student__username', 'course__title', 'transaction_id')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'payment', 'installment_number', 'amount', 'due_date', 'status', 'paid_date')
    list_filter = ('status', 'due_date', 'payment__course__subject')
    search_fields = ('payment__student__username', 'payment__course__title')
    ordering = ('payment', 'installment_number')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('id', 'payment', 'amount', 'status', 'processed_by', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('payment__student__username', 'payment__course__title', 'reason')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(MoneyBackGuarantee)
class MoneyBackGuaranteeAdmin(admin.ModelAdmin):
    list_display = ('id', 'enrollment', 'is_eligible', 'job_offer_date', 'guarantee_expiry_date', 'refund_processed')
    list_filter = ('is_eligible', 'refund_processed', 'guarantee_expiry_date')
    search_fields = ('enrollment__student__username', 'enrollment__course__title')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
