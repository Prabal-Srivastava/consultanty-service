from django.http import JsonResponse
from django.shortcuts import render

def dashboard(request):
    """
    Simple API Dashboard / Root View
    """
    api_routes = {
        "Authentication": "/api/auth/",
        "Courses": "/api/courses/",
        "Quizzes": "/api/quizzes/",
        "Payments": "/api/payments/",
        "Chat": "/api/chat/",
        "Interviews": "/api/interviews/",
        "Consultancy": "/api/consultancy/",
        "Leads": "/api/leads/",
        "Earnings": "/api/earnings/",
    }
    return JsonResponse({"message": "Welcome to Student Management System API", "routes": api_routes})

def custom_404(request, exception=None):
    """
    Custom 404 handler that provides a link back to the dashboard/root.
    """
    response_data = {
        "error": "Not Found",
        "message": "The requested resource was not found.",
        "dashboard_url": "/",
        "hint": "Check the URL or go back to the dashboard."
    }
    return JsonResponse(response_data, status=404)
