from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        user = User.objects.get(id=user_id)
        return user
    except User.DoesNotExist:
        return AnonymousUser()

class JwtAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Close old connections
        # if "user" in scope:
        #    pass
            
        # Get the token
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]
        
        if token is None:
            scope["user"] = AnonymousUser()
        else:
            try:
                # Verify and decode the token using SimpleJWT
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                
                # Get the user
                scope["user"] = await get_user(user_id)
            except (InvalidToken, TokenError, Exception) as e:
                # print(e)
                scope["user"] = AnonymousUser()
                
        return await super().__call__(scope, receive, send)
