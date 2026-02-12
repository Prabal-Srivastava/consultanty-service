"""
ASGI config for student_management project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import re_path
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'student_management.settings')

django_asgi_app = get_asgi_application()

from .middleware import JwtAuthMiddleware
from chat import routing as chat_routing
from notifications import routing as notifications_routing

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            JwtAuthMiddleware(
                URLRouter(
                    chat_routing.websocket_urlpatterns + notifications_routing.websocket_urlpatterns
                )
            )
        ),
    }
)
