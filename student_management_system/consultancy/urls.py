from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConsultancyServiceViewSet, OrganizationViewSet, 
    ConsultancyContractViewSet, StudentEnrollmentViewSet, 
    ConsultancyReportViewSet, ConsultancySessionViewSet, 
    SuccessStoryViewSet, FAQViewSet, contact_us
)

router = DefaultRouter()
router.register(r'sessions', ConsultancySessionViewSet)
router.register(r'services', ConsultancyServiceViewSet)
router.register(r'organizations', OrganizationViewSet)
router.register(r'contracts', ConsultancyContractViewSet)
router.register(r'enrollments', StudentEnrollmentViewSet)
router.register(r'reports', ConsultancyReportViewSet)
router.register(r'success-stories', SuccessStoryViewSet)
router.register(r'faqs', FAQViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('contact/', contact_us, name='contact-us'),
]