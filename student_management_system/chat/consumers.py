import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Room, Message, VideoCall

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        
        # Check authentication
        if not self.scope["user"].is_authenticated:
            await self.close()
            return
            
        # Check if user is participant
        is_participant = await self.check_participant()
        if not is_participant:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        # username is no longer trusted from client
        user = self.scope["user"]
        username = user.username
        user_id = user.id

        # Save message to database
        await self.save_message(message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': username,
                'user_id': user_id
            }
        )

    async def chat_message(self, event):
        message = event['message']
        username = event['username']
        user_id = event.get('user_id', None)
        
        # Prepare response data
        response_data = {
            'message': message,
            'username': username,
            'user_id': user_id
        }
        
        # Add optional fields if present
        if 'call_id' in event:
            response_data['call_id'] = event['call_id']
        if 'action' in event:
            response_data['action'] = event['action']

        # Send message to WebSocket
        await self.send(text_data=json.dumps(response_data))
    
    @database_sync_to_async
    def check_participant(self):
        try:
            room = Room.objects.get(id=self.room_id)
            user = self.scope["user"]
            if user.user_type == 'admin':
                return True
            return room.participants.filter(id=user.id).exists()
        except Room.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, message):
        user = self.scope["user"]
        room = Room.objects.get(id=self.room_id)
        Message.objects.create(room=room, sender=user, content=message)

class VideoCallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.call_id = self.scope['url_route']['kwargs']['call_id']
        self.call_group_name = f'video_call_{self.call_id}'
        
        # Check authentication
        if not self.scope["user"].is_authenticated:
            await self.close()
            return
            
        # Check if user is participant
        is_participant = await self.check_participant()
        if not is_participant:
            await self.close()
            return

        # Join call group
        await self.channel_layer.group_add(
            self.call_group_name,
            self.channel_name
        )

        await self.accept()
        
        # Notify group about new participant
        await self.channel_layer.group_send(
            self.call_group_name,
            {
                'type': 'user_joined',
                'username': self.scope["user"].username
            }
        )

    async def disconnect(self, close_code):
        # Leave call group
        await self.channel_layer.group_discard(
            self.call_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json['action']
        username = self.scope["user"].username
        
        if action == 'offer':
            offer = text_data_json['offer']
            target = text_data_json.get('target')
            await self.channel_layer.group_send(
                self.call_group_name,
                {
                    'type': 'call_offer',
                    'offer': offer,
                    'username': username,
                    'target': target
                }
            )
        elif action == 'answer':
            answer = text_data_json['answer']
            target = text_data_json.get('target')
            await self.channel_layer.group_send(
                self.call_group_name,
                {
                    'type': 'call_answer',
                    'answer': answer,
                    'username': username,
                    'target': target
                }
            )
        elif action == 'ice-candidate':
            candidate = text_data_json['candidate']
            target = text_data_json.get('target')
            await self.channel_layer.group_send(
                self.call_group_name,
                {
                    'type': 'ice_candidate',
                    'candidate': candidate,
                    'username': username,
                    'target': target
                }
            )
        elif action == 'user_left':
            await self.channel_layer.group_send(
                self.call_group_name,
                {
                    'type': 'user_left',
                    'username': username
                }
            )

    async def call_offer(self, event):
        await self.send(text_data=json.dumps({
            'action': 'offer',
            'offer': event['offer'],
            'username': event['username'],
            'target': event.get('target')
        }))

    async def call_answer(self, event):
        await self.send(text_data=json.dumps({
            'action': 'answer',
            'answer': event['answer'],
            'username': event['username'],
            'target': event.get('target')
        }))

    async def ice_candidate(self, event):
        await self.send(text_data=json.dumps({
            'action': 'ice-candidate',
            'candidate': event['candidate'],
            'username': event['username'],
            'target': event.get('target')
        }))

    async def user_left(self, event):
        await self.send(text_data=json.dumps({
            'action': 'user_left',
            'username': event['username']
        }))

    async def user_joined(self, event):
        await self.send(text_data=json.dumps({
            'action': 'user_joined',
            'username': event['username']
        }))

    @database_sync_to_async
    def check_participant(self):
        try:
            call = VideoCall.objects.get(id=self.call_id)
            user = self.scope["user"]
            if user.user_type == 'admin':
                return True
            # Allow caller
            if call.caller == user:
                return True
            # Check room participants for group calls
            return call.room.participants.filter(id=user.id).exists()
        except VideoCall.DoesNotExist:
            return False