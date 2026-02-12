from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from notifications.models import Notification
from notifications.utils import send_notification
import time

User = get_user_model()

class Command(BaseCommand):
    help = 'Verify Notification System'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting Notification Verification...')
        
        # Setup users
        student = User.objects.filter(user_type='student').first()
        if not student:
            self.stdout.write(self.style.ERROR('Student not found'))
            return

        # Send Notification
        title = f"Test Notification {int(time.time())}"
        send_notification(
            recipient=student,
            title=title,
            message="This is a test notification",
            notification_type="system"
        )
        
        # Verify in DB
        notif = Notification.objects.filter(recipient=student, title=title).first()
        if notif:
            self.stdout.write(self.style.SUCCESS(f'Notification created in DB: {notif.title}'))
        else:
            self.stdout.write(self.style.ERROR('Notification NOT found in DB'))
