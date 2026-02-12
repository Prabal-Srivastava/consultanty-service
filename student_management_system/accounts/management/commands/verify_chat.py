from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from chat.models import Room, Message
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Verify Chat Functionality'

    def handle(self, *args, **kwargs):
        self.stdout.write('Verifying Chat Functionality...')
        
        # Setup users
        try:
            student = User.objects.get(username='student1')
            tutor = User.objects.get(username='tutor1')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Users not found. Run seed_full_db first.'))
            return

        client = APIClient()
        
        # 1. Create Room
        self.stdout.write('\n--- 1. Testing Room Creation ---')
        client.force_authenticate(user=student)
        
        room_data = {
            'name': 'Test Room',
            'room_type': 'one_on_one',
            'participants': [tutor.id]
        }
        
        # Check if room already exists
        if Room.objects.filter(name='Test Room').exists():
            Room.objects.get(name='Test Room').delete()
            
        response = client.post('/api/chat/rooms/create/', room_data)
        if response.status_code == 201:
            self.stdout.write(self.style.SUCCESS(f'Room created: {response.data["id"]}'))
            room_id = response.data['id']
        else:
            self.stdout.write(self.style.ERROR(f'Failed to create room: {response.data}'))
            return

        # 2. Send Message
        self.stdout.write('\n--- 2. Testing Send Message ---')
        msg_data = {
            'content': 'Hello from test script'
        }
        
        # Updated endpoint to match urls.py (merged list/create view)
        response = client.post(f'/api/chat/rooms/{room_id}/messages/', msg_data)
        if response.status_code == 201:
            self.stdout.write(self.style.SUCCESS('Message sent successfully'))
        else:
            self.stdout.write(self.style.ERROR(f'Failed to send message: {response.data}'))
            return
            
        # 3. Get Messages
        self.stdout.write('\n--- 3. Testing Get Messages ---')
        response = client.get(f'/api/chat/rooms/{room_id}/messages/')
        if response.status_code == 200:
            count = len(response.data)
            self.stdout.write(self.style.SUCCESS(f'Retrieved {count} messages'))
        else:
            self.stdout.write(self.style.ERROR(f'Failed to get messages: {response.data}'))
            
        # 4. Create Support Chat
        self.stdout.write('\n--- 4. Testing Support Chat Creation ---')
        response = client.post('/api/chat/rooms/support/')
        if response.status_code == 201:
            self.stdout.write(self.style.SUCCESS(f'Support chat created: {response.data["id"]}'))
        else:
            # Might fail if no admin exists, which is expected in some test envs
            self.stdout.write(self.style.WARNING(f'Support chat creation result: {response.status_code} - {response.data}'))

        self.stdout.write(self.style.SUCCESS('\nChat API Verification Completed'))
