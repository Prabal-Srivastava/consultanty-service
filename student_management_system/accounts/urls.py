from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('send-login-otp/', views.send_login_otp, name='send_login_otp'),
    path('verify-login-otp/', views.verify_login_otp, name='verify_login_otp'),
    path('verify-email/', views.verify_email, name='verify_email'),
    path('resend-verification/', views.resend_verification_email, name='resend_verification_email'),
    path('request-password-reset/', views.request_password_reset, name='request_password_reset'),
    path('confirm-password-reset/', views.confirm_password_reset, name='confirm_password_reset'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/<int:id>/', views.UserDetailView.as_view(), name='user_detail'),
    path('tutors/', views.TutorListView.as_view(), name='tutor_list'),
    path('tutors/<int:user_id>/approve/', views.approve_tutor, name='approve_tutor'),
    path('students/', views.StudentListView.as_view(), name='student_list'),
    path('dashboard/student/', views.StudentDashboardView.as_view(), name='student_dashboard'),
]