from django.conf import settings
from .models import Notification

def send_notification(recipient, title, message, notification_type='system', sender=None, link=None):
    notification = Notification.objects.create(
        recipient=recipient,
        sender=sender,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link
    )
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f'user_{recipient.id}'
            event = {
                'type': 'send_notification',
                'data': {
                    'id': notification.id,
                    'title': notification.title,
                    'message': notification.message,
                    'notification_type': notification.notification_type,
                    'created_at': notification.created_at.isoformat(),
                    'link': notification.link,
                    'sender': sender.username if sender else None
                }
            }
            async_to_sync(channel_layer.group_send)(group_name, event)
    except Exception:
        pass
    return notification
