from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'earnings', views.EarningViewSet, basename='earning')
router.register(r'payouts', views.PayoutRequestViewSet, basename='payout')

urlpatterns = [
    path('', include(router.urls)),
]
