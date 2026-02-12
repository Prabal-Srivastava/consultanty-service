from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Room, Message, VideoCall, CallRecord
from accounts.models import User
from .serializers import RoomSerializer, MessageSerializer, VideoCallSerializer, CallRecordSerializer
import uuid
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class RoomListCreateView(generics.ListCreateAPIView):
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Room.objects.filter(participants=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        room = serializer.save()
        # Add creator as participant
        room.participants.add(self.request.user)

class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Room.objects.filter(participants=self.request.user, is_active=True)

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        room_id = self.kwargs['room_id']
        room = get_object_or_404(Room, id=room_id, participants=self.request.user)
        return Message.objects.filter(room=room).select_related('sender')
    
    def perform_create(self, serializer):
        room_id = self.kwargs['room_id']
        room = get_object_or_404(Room, id=room_id, participants=self.request.user)
        message = serializer.save(room=room, sender=self.request.user)
        
        # Broadcast message to room group
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{room.id}',
            {
                'type': 'chat_message',
                'message': message.content,
                'username': self.request.user.username
            }
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_room(request):
    """Create a new chat room"""
    room_name = request.data.get('name')
    room_type = request.data.get('room_type', 'one_on_one')
    participant_ids = request.data.get('participants', [])
    
    if not room_name:
        return Response({
            'error': 'Room name is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create room
    room = Room.objects.create(
        name=room_name,
        room_type=room_type
    )
    
    # Add participants
    room.participants.add(request.user)
    for participant_id in participant_ids:
        try:
            user = User.objects.get(id=participant_id)
            room.participants.add(user)
        except User.DoesNotExist:
            pass
    
    serializer = RoomSerializer(room)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_video_call(request, room_id):
    """Start a video call"""
    room = get_object_or_404(Room, id=room_id, participants=request.user)
    audio_only = request.data.get('audio_only', False)
    
    # Create video call
    # If group call, receiver will be null
    receiver = None
    if room.room_type == 'one_on_one':
        other_participants = room.participants.exclude(id=request.user.id)
        if other_participants.exists():
            receiver = other_participants.first()
    
    call = VideoCall.objects.create(
        room=room,
        caller=request.user,
        receiver=receiver,
        status='pending',
        audio_only=audio_only
    )
    
    # Notify room participants about incoming call
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'chat_{room.id}',
        {
            'type': 'chat_message',
            'message': f"Video call started by {request.user.username}",
            'username': 'System',
            'user_id': None,
            'call_id': call.id,
            'action': 'incoming_call',
            'audio_only': audio_only
        }
    )
    
    serializer = VideoCallSerializer(call)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_video_call(request, call_id):
    """Accept a video call"""
    call = get_object_or_404(VideoCall, id=call_id, status='pending')
    
    # Check if user is allowed to accept
    if call.room.room_type == 'one_on_one':
        if call.receiver != request.user:
            return Response({'error': 'You are not the intended receiver of this call'}, status=status.HTTP_403_FORBIDDEN)
    else:
        # Group or support chat: any participant except the caller can accept
        if not call.room.participants.filter(id=request.user.id).exists():
            return Response({'error': 'You are not a participant of this chat'}, status=status.HTTP_403_FORBIDDEN)
        if call.caller == request.user:
            return Response({'error': 'Caller cannot accept their own call'}, status=status.HTTP_403_FORBIDDEN)

    call.status = 'ongoing'
    call.start_time = timezone.now()
    # If it was a group call and we're accepting, we become the primary receiver for record purposes
    if not call.receiver:
        call.receiver = request.user
    call.save()
    
    # Broadcast that call was accepted
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'chat_{call.room.id}',
        {
            'type': 'chat_message',
            'message': f"Call accepted by {request.user.username}",
            'username': 'System',
            'user_id': None,
            'call_id': call.id,
            'action': 'call_accepted',
            'accepted_by': request.user.username
        }
    )
    
    # Also notify the video call group directly for participants already in the call UI
    async_to_sync(channel_layer.group_send)(
        f'video_call_{call.id}',
        {
            'type': 'user_joined',
            'username': request.user.username
        }
    )
    
    serializer = VideoCallSerializer(call)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def end_video_call(request, call_id):
    """End a video call"""
    call = get_object_or_404(VideoCall, id=call_id)
    
    if call.caller != request.user and call.receiver != request.user:
        return Response({
            'error': 'You are not part of this call'
        }, status=status.HTTP_403_FORBIDDEN)
    
    call.status = 'completed'
    call.end_time = timezone.now()
    
    if call.start_time:
        duration = (call.end_time - call.start_time).total_seconds()
        call.duration = int(duration)
    
    call.save()
    
    serializer = VideoCallSerializer(call)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_support_chat(request):
    """Create a support chat room with admin/tutor"""
    user_type = request.user.user_type
    
    if user_type == 'student':
        # Connect with tutor or admin
        available_users = User.objects.filter(user_type__in=['tutor', 'admin'])
    elif user_type == 'tutor':
        # Connect with admin
        available_users = User.objects.filter(user_type='admin')
    else:
        return Response({
            'error': 'Admin users cannot create support chats'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not available_users.exists():
        return Response({
            'error': 'No available support users'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create room name
    support_user = available_users.first()
    room_name = f"support_{request.user.id}_{support_user.id}_{uuid.uuid4().hex[:8]}"
    
    # Create room
    room = Room.objects.create(
        name=room_name,
        room_type='support'
    )
    
    # Add participants
    room.participants.add(request.user, support_user)
    
    serializer = RoomSerializer(room)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

class VideoCallHistoryView(generics.ListAPIView):
    serializer_class = VideoCallSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return VideoCall.objects.filter(
            caller=self.request.user
        ).union(
            VideoCall.objects.filter(receiver=self.request.user)
        ).order_by('-created_at')

class CallRecordListView(generics.ListAPIView):
    serializer_class = CallRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CallRecord.objects.filter(
            video_call__caller=self.request.user
        ).union(
            CallRecord.objects.filter(video_call__receiver=self.request.user)
        ).order_by('-created_at')