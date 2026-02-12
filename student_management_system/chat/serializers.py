from rest_framework import serializers
from .models import Room, Message, VideoCall, CallRecord
from accounts.serializers import UserSerializer

class RoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = Room
        fields = ('id', 'name', 'room_type', 'participants', 'participant_ids', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        room = Room.objects.create(**validated_data)
        
        # Add participants
        request = self.context.get('request')
        if request:
            room.participants.add(request.user)
        
        for participant_id in participant_ids:
            try:
                from accounts.models import User
                user = User.objects.get(id=participant_id)
                room.participants.add(user)
            except User.DoesNotExist:
                pass
        
        return room

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ('id', 'room', 'sender', 'content', 'timestamp', 'is_read')
        read_only_fields = ('id', 'room', 'sender', 'timestamp')

class VideoCallSerializer(serializers.ModelSerializer):
    caller = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    room = RoomSerializer(read_only=True)
    
    class Meta:
        model = VideoCall
        fields = ('id', 'room', 'caller', 'receiver', 'status', 'start_time', 'end_time', 'duration', 'audio_only', 'created_at')
        read_only_fields = ('id', 'caller', 'created_at')

class CallRecordSerializer(serializers.ModelSerializer):
    video_call = VideoCallSerializer(read_only=True)
    
    class Meta:
        model = CallRecord
        fields = ('id', 'video_call', 'recording_url', 'transcript', 'created_at')
        read_only_fields = ('id', 'created_at')