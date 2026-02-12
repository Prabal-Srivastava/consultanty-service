"""
URL configuration for student_management project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import os
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from django.utils import timezone
from . import views

handler404 = 'student_management.views.custom_404'

from django.http import JsonResponse
from django.urls import get_resolver

def root_view(request):
    # Try to list some available endpoints for debugging
    resolver = get_resolver()
    routes = []
    for url_pattern in resolver.url_patterns:
        try:
            routes.append(str(url_pattern.pattern))
        except:
            pass
            
    return JsonResponse({
        "status": "healthy",
        "message": "Student Management System API is running",
        "environment": "production",
        "debug_info": {
            "available_routes_prefixes": routes[:15], # First 15 for safety
            "request_path": request.path,
        }
    })

from django.db import connection

def health_check(request):
    """Deep health check that tests database connection"""
    db_ok = False
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_ok = True
    except Exception as e:
        error_msg = str(e)
        
    return JsonResponse({
        "status": "online" if db_ok else "degraded",
        "database": "connected" if db_ok else "failed",
        "error": error_msg if not db_ok else None,
        "timestamp": timezone.now().isoformat()
    }, status=200 if db_ok else 500)

urlpatterns = [
    path('health/', health_check),
    path('', root_view),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/quizzes/', include('quizzes.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/interviews/', include('interviews.urls')),
    path('api/consultancy/', include('consultancy.urls')),  # Added consultancy URLs
    path('api/leads/', include('leads.urls')),  # Added leads URLs
    path('api/earnings/', include('earnings.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
