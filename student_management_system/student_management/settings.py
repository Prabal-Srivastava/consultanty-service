import os
from pathlib import Path
from datetime import timedelta
import environ
import dj_database_url
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
# Only read .env if it exists (useful for local development)
env_file = os.path.join(BASE_DIR, '.env')
if os.path.exists(env_file):
    environ.Env.read_env(env_file)

# Allowed Hosts
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1', '.vercel.app', '.onrender.com'])

RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Application definition
INSTALLED_APPS = [
    'daphne',  # Must be at the top for Channels
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'accounts',
    'courses',
    'quizzes',
    'payments',
    'chat',
    'interviews',
    'consultancy',  # Added consultancy app
    'leads',
    'notifications',
    'earnings',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'student_management.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'student_management.wsgi.application'
ASGI_APPLICATION = 'student_management.asgi.application'

AUTH_USER_MODEL = 'accounts.User'

# Database Configuration
DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=0,  # Required for Supabase Transaction Pooler
    )
}

# Optimized PostgreSQL options for Supabase
if DATABASES['default'].get('ENGINE') == 'django.db.backends.postgresql':
    DATABASES['default']['OPTIONS'] = {
        'sslmode': 'require',
        'connect_timeout': 10,  # Fail faster if connection is stuck
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# whitenoise
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEBUG = env.bool('DJANGO_DEBUG', default=False)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('DJANGO_SECRET_KEY', default='django-insecure-default-key-for-build-purposes-only')

if not DEBUG and SECRET_KEY == 'django-insecure-default-key-for-build-purposes-only':
    # In production, we still want to ensure a real key is provided via Vercel Dashboard
    # but we don't want to crash the entire process during initial import if possible.
    pass

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# Security settings
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=False)
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=False)
CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=False)

# CSRF Trusted Origins (Required for Django 4.0+)
CSRF_TRUSTED_ORIGINS = [
    "https://consultanty-service.vercel.app",
    "https://student-management-backend-8s4c.onrender.com",
]

# Simple JWT Configuration
SIMPLE_JWT = {
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Session Configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_HTTPONLY = True

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "https://consultanty-service.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
]

# CSRF settings
if DEBUG:
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
else:
    # Combine the hardcoded origins with any from environment variables
    env_csrf_origins = env.list('CSRF_TRUSTED_ORIGINS', default=[])
    CSRF_TRUSTED_ORIGINS = [
        "https://consultanty-service.vercel.app",
        "https://student-management-backend-8s4c.onrender.com",
    ] + env_csrf_origins

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='your-email@gmail.com')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='your-app-password')  # Use App Password for Gmail
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@edusystem.com')

# For SaaS application - Email configuration for different environments
if not DEBUG:
    # Production email settings
    EMAIL_HOST = env('PROD_EMAIL_HOST', default='smtp.sendgrid.net')
    EMAIL_PORT = env.int('PROD_EMAIL_PORT', default=587)
    EMAIL_HOST_USER = env('PROD_EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = env('PROD_EMAIL_HOST_PASSWORD', default='')
else:
    # Development email settings - Use console backend to prevent real emails during development
    # Uncomment the next line if you want to see emails in console during development
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    pass

# Additional SaaS configuration
CONTACT_RECIPIENT_EMAIL = env('CONTACT_RECIPIENT_EMAIL', default='contact@edusystem.com')

# Stripe Settings
STRIPE_PUBLISHABLE_KEY = env('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = env('STRIPE_WEBHOOK_SECRET', default='')

if not DEBUG and (not STRIPE_PUBLISHABLE_KEY or not STRIPE_SECRET_KEY):
    # Log a warning instead of crashing if possible, or handle it in views
    # raise ImproperlyConfigured("Stripe keys must be set in production environment")
    pass

# Frontend URL
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:3000')