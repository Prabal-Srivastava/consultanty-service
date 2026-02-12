from django.contrib import admin
from .models import ConsultancyService, Organization, ConsultancyContract, SuccessStory, FAQ

@admin.register(ConsultancyService)
class ConsultancyServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'service_type', 'package_type', 'price', 'is_active')
    list_filter = ('service_type', 'package_type', 'is_active')
    search_fields = ('name', 'description')

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization_type', 'contact_person', 'email', 'phone')
    list_filter = ('organization_type', 'is_active')
    search_fields = ('name', 'contact_person', 'email')

@admin.register(ConsultancyContract)
class ConsultancyContractAdmin(admin.ModelAdmin):
    list_display = ('organization', 'service', 'start_date', 'end_date', 'status', 'total_amount')
    list_filter = ('status', 'start_date', 'end_date')
    search_fields = ('organization__name', 'service__name')

@admin.register(SuccessStory)
class SuccessStoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'is_job_placement', 'is_active', 'created_at')
    list_filter = ('is_job_placement', 'is_active')
    search_fields = ('name', 'role', 'story')

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ('question', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('question', 'answer')
    ordering = ('order',)
